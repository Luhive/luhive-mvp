import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import { EventReminderEmail } from "~/templates/event-reminder-email";
import { Resend } from "resend";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ActionFunctionArgs } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

interface SendRemindersRequest {
  reminderTime: '1-hour' | '3-hours' | '1-day';
  secret?: string;
}

const CRON_SECRET = process.env.CRON_SECRET || "development-secret";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_SENDER = process.env.EMAIL_SENDER || "events@events.luhive.com";
const FROM_EMAIL = process.env.EMAIL_SENDER?.includes("<") 
  ? process.env.EMAIL_SENDER 
  : `Luhive <${EMAIL_SENDER}>`;

/**
 * Calculate the time window when a reminder should be sent
 * For example, 1-hour reminder sends only when event is ~1 hour away
 */
function getRemindersToSend(reminderTime: '1-hour' | '3-hours' | '1-day') {
	const now = dayjs.utc();

	switch (reminderTime) {
		case '1-hour':
			// Send when event starts between (now + 1hour - 10min) and (now + 1hour + 10min)
			return {
				start: now.clone().add(1, 'hour').subtract(10, 'minutes'),
				end: now.clone().add(1, 'hour').add(10, 'minutes'),
			};
		case '3-hours':
			// Send when event starts between (now + 3hours - 15min) and (now + 3hours + 15min)
			return {
				start: now.clone().add(3, 'hours').subtract(15, 'minutes'),
				end: now.clone().add(3, 'hours').add(15, 'minutes'),
			};
		case '1-day':
			// Send when event starts between (now + 1day - 30min) and (now + 1day + 30min)
			return {
				start: now.clone().add(1, 'day').subtract(30, 'minutes'),
				end: now.clone().add(1, 'day').add(30, 'minutes'),
			};
	}
}

interface EventWithReminders {
	id: string;
	title: string;
	start_time: string;
	end_time: string | null;
	timezone: string;
	location_address: string | null;
	online_meeting_link: string | null;
	community_id: string;
	event_reminders: {
		reminder_times: ('1-hour' | '3-hours' | '1-day')[];
		custom_message: string | null;
	} | null;
	communities: {
		name: string;
	};
}

interface EventRegistration {
	id: string;
	user_id: string | null;
	anonymous_name: string | null;
	anonymous_email: string | null;
	is_verified: boolean;
}

async function sendRemindersHandler(body: SendRemindersRequest) {
	const { reminderTime, secret } = body;

	// Validate secret for security
	if (secret !== CRON_SECRET) {
		console.warn("❌ Invalid cron secret provided");
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Validate reminderTime
	if (!["1-hour", "3-hours", "1-day"].includes(reminderTime)) {
		return Response.json({ error: "Invalid reminderTime parameter" }, { status: 400 });
	}

	console.log(`🔄 Starting reminder send process for: ${reminderTime}`);

	try {
		// Create service role client
		const supabase = createServiceRoleClient();

		// Calculate time range
		const timeRange = getRemindersToSend(reminderTime);
		const now = dayjs.utc();

		console.log(`⏰ Current UTC time: ${now.format('YYYY-MM-DD HH:mm:ss Z')}`);
		console.log(`⏰ Reminder window: ${timeRange.start.format('YYYY-MM-DD HH:mm:ss Z')} to ${timeRange.end.format('YYYY-MM-DD HH:mm:ss Z')}`);
		console.log(`⏰ Finding events with start_time between: ${timeRange.start.toISOString()} and ${timeRange.end.toISOString()}`);

		// Query events with reminders that should be triggered now
		const { data: eventsWithReminders, error: eventsError } = await supabase
			.from("events")
			.select(
				`
				id,
				title,
				start_time,
				end_time,
				timezone,
				location_address,
				online_meeting_link,
				community_id,
				event_reminders(reminder_times, custom_message),
				communities(name)
				`
			)
			.eq("status", "published")
			.gte("start_time", timeRange.start.toISOString())
			.lte("start_time", timeRange.end.toISOString()) as { data: EventWithReminders[] | null; error: any };

		if (eventsError) {
			console.error("❌ Error querying events:", eventsError);
			return Response.json(
				{ error: "Failed to query events", details: eventsError },
				{ status: 500 }
			);
		}

		if (!eventsWithReminders || eventsWithReminders.length === 0) {
			console.log(`✓ No events found for ${reminderTime} reminders`);
			return Response.json({ success: true, reminders_sent: 0, message: "No events to remind" });
		}

		console.log(`📋 Found ${eventsWithReminders.length} events. Checking each one:`);

		let totalReminders = 0;
		const failedReminders: string[] = [];

		// Process each event
		for (const event of eventsWithReminders) {
			const eventStartUTC = dayjs(event.start_time).utc();
			const eventStartLocal = dayjs(event.start_time).tz(event.timezone);
			console.log(`  📅 Event: "${event.title}"`);
			console.log(`     UTC time: ${eventStartUTC.format('YYYY-MM-DD HH:mm:ss Z')}`);
			console.log(`     Local (${event.timezone}): ${eventStartLocal.format('YYYY-MM-DD HH:mm:ss Z')}`);
			// Check if this event has reminders enabled
			if (!event.event_reminders) {
				console.log(`  ⏭️  No reminders configured for event ${event.id}`);
				continue;
			}

			const eventReminder = event.event_reminders;

			// Check if eventReminder has reminder_times property
			if (!eventReminder.reminder_times || eventReminder.reminder_times.length === 0) {
				console.warn(`  ⚠️  Event reminder missing reminder_times for event ${event.id}`);
				continue;
			}

			// Check if this reminder time is enabled for this event
			if (!eventReminder.reminder_times.includes(reminderTime)) {
				console.log(`  ⏭️  Reminder time ${reminderTime} not enabled for event ${event.id}`);
				continue;
			}

			console.log(`📧 Processing reminders for event: ${event.title} (${event.id})`);

			// Fetch registered participants
			const { data: registrations, error: registrationsError } = await supabase
				.from("event_registrations")
				.select("id, user_id, anonymous_name, anonymous_email, is_verified")
				.eq("event_id", event.id)
				.eq("approval_status", "approved")
				.eq("rsvp_status", "going") as { data: EventRegistration[] | null; error: any };

			if (registrationsError) {
				console.error(`❌ Error fetching registrations for event ${event.id}:`, registrationsError);
				failedReminders.push(`${event.title}: Failed to fetch registrations`);
				continue;
			}

			if (!registrations || registrations.length === 0) {
				console.log(`  No approved registrations for event ${event.id}`);
				continue;
			}

			// Format event data
			const eventDate = dayjs(event.start_time)
				.tz(event.timezone)
				.format("dddd, MMMM D, YYYY");
			const eventTime = dayjs(event.start_time)
				.tz(event.timezone)
				.format("h:mm A z");

			// Send reminders to each participant
			for (const registration of registrations) {
				try {
					let participantEmail: string;
					let participantName: string;

					if (registration.user_id) {
						// Regular user - fetch email from auth
						const { data: userData, error: authError } = await supabase.auth.admin.getUserById(registration.user_id);
						if (authError || !userData?.user?.email) {
							console.warn(`  ⚠️  Could not fetch email for user ${registration.user_id}`);
							failedReminders.push(`Registration ${registration.id}: Could not fetch user email`);
							continue;
						}

						participantEmail = userData.user.email;
						participantName = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0];
					} else {
						// Anonymous registration - use anonymous_email
						if (!registration.anonymous_email) {
							console.warn(`  ⚠️  Anonymous registration ${registration.id} has no email`);
							failedReminders.push(`Registration ${registration.id}: Anonymous but no email provided`);
							continue;
						}

						participantEmail = registration.anonymous_email;
						participantName = registration.anonymous_name || "Guest";
						console.log(`  👤 Anonymous participant: ${participantName} (${participantEmail})`);
					}

					// Check if reminder has already been sent
					const { data: sentReminder, error: sentError } = await supabase
						.from("sent_reminders")
						.select("id")
						.eq("registration_id", registration.id)
						.eq("reminder_time", reminderTime)
						.single();

					if (sentReminder) {
						console.log(`  ✓ Reminder already sent for registration ${registration.id}`);
						continue;
					}

					if (sentError && sentError.code !== "PGRST116") {
						console.warn(`  Warning checking sent reminders: ${sentError.message}`);
					}

					// Send email
					if (!RESEND_API_KEY) {
						console.error(`  ❌ RESEND_API_KEY not configured`);
						failedReminders.push(`${participantEmail}: RESEND_API_KEY not configured`);
						continue;
					}

					const resend = new Resend(RESEND_API_KEY);
					const { data: emailData, error: emailError } = await resend.emails.send({
						from: FROM_EMAIL,
						to: [participantEmail],
						subject: `Reminder: ${event.title} is ${reminderTime === '1-day' ? 'tomorrow' : reminderTime === '3-hours' ? 'starting in 3 hours' : 'starting in 1 hour'}!`,
						react: EventReminderEmail({
							eventTitle: event.title,
							communityName: event.communities?.name || "Community",
							eventDate,
							eventTime,
							eventLink: `https://luhive.com/events/${event.id}`,
							recipientName: participantName,
							locationAddress: event.location_address || undefined,
							onlineMeetingLink: event.online_meeting_link || undefined,
							customMessage: eventReminder.custom_message,
							reminderTime,
						}),
					});

					if (emailError) {
						console.error(`  ❌ Failed to send email to ${participantEmail}:`, emailError);
						failedReminders.push(`${participantEmail}: ${emailError.message}`);
						continue;
					}

					if (emailData?.id) {
						console.log(`  ✓ Email sent to ${participantEmail} (ID: ${emailData.id})`);

						// Record that reminder was sent
						const { error: insertError } = await supabase
							.from("sent_reminders")
							.insert({
								event_id: event.id,
								registration_id: registration.id,
								reminder_time: reminderTime,
								recipient_email: participantEmail,
							});

						if (insertError) {
							console.warn(`  Warning: Failed to record sent reminder: ${insertError.message}`);
						}

						totalReminders++;
					} else {
						console.error(`  ❌ Failed to send email to ${participantEmail}: No email ID returned`);
						failedReminders.push(`${participantEmail}: No email ID returned`);
					}
				} catch (error) {
					console.error(`  ❌ Error processing registration ${registration.id}:`, error);
					failedReminders.push(`Registration ${registration.id}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		}

		console.log(
			`✓ Reminder process complete. Sent: ${totalReminders}, Failed: ${failedReminders.length}`
		);

		return Response.json({
			success: true,
			reminders_sent: totalReminders,
			failures: failedReminders.length > 0 ? failedReminders : undefined,
		});
	} catch (error) {
		console.error("❌ Error in send-reminders endpoint:", error);
		return Response.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	try {
		const body = await request.json();
		return sendRemindersHandler(body);
	} catch (error) {
		return Response.json(
			{
				error: "Invalid request format",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 400 }
		);
	}
}
