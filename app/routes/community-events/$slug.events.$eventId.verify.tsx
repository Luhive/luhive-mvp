import { redirect } from "react-router";
import { createClient, createServiceRoleClient } from "~/lib/supabase.server";
import type { Route } from "./+types/$slug.events.$eventId.verify";
import { sendRegistrationConfirmationEmail, sendSubscriptionConfirmationEmail } from "~/lib/email.server";
import { getExternalPlatformName } from "~/lib/utils/external-platform";
import type { ExternalPlatform } from "~/models/event.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function loader({ request, params }: Route.LoaderArgs) {
	const { headers } = createClient(request);
	// Use service role client to bypass RLS for verification
	const supabase = createServiceRoleClient();
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	const slug = params.slug;
	const eventId = params.eventId;

	if (!token) {
		throw new Response("Verification token is required", { status: 400 });
	}

	if (!slug || !eventId) {
		throw new Response("Invalid event", { status: 400 });
	}

	// Find registration by token
	console.log("Looking for registration with token:", token);
	console.log("Looking for eventId:", eventId);
	
	// First, try to find the registration by token only
	const { data: registration, error: findError } = await supabase
		.from("event_registrations")
		.select("*")
		.eq("verification_token", token)
		.maybeSingle();

	if (findError) {
		console.error("Error finding registration:", findError);
		throw new Response("Database error", { status: 500 });
	}

	if (!registration) {
		console.log("No registration found with this token");
		throw new Response("Invalid or expired verification link", { status: 400 });
	}

	console.log("Registration found:", registration.id);
	console.log("Registration event_id:", registration.event_id);
	console.log("URL eventId:", eventId);
	
	// Verify the registration belongs to this event
	if (registration.event_id !== eventId) {
		console.error("Token belongs to different event:", registration.event_id, "vs", eventId);
		throw new Response("Invalid verification link for this event", { status: 400 });
	}

	// Check if token has expired
	const tokenExpiresAt = registration.token_expires_at
		? new Date(registration.token_expires_at)
		: null;
	const now = new Date();

	if (tokenExpiresAt && now > tokenExpiresAt) {
		console.log("Token expired at:", tokenExpiresAt);
		throw new Response("Verification link has expired", { status: 400 });
	}

	// Check if already verified
	if (registration.is_verified) {
		console.log("Registration already verified");
		// Already verified, just redirect to event page
		return redirect(`/c/${slug}/events/${eventId}?verified=already`, {
			headers,
		});
	}

	// Mark registration as verified
	console.log("Marking registration as verified");
	const { error: updateError } = await supabase
		.from("event_registrations")
		.update({
			is_verified: true,
			verification_token: null,
			token_expires_at: null,
		})
		.eq("id", registration.id);

	if (updateError) {
		console.error("Failed to verify registration:", updateError);
		throw new Response("Failed to verify registration", { status: 500 });
	}

	// Check if approval is pending
	if (registration.approval_status === 'pending') {
		console.log("Registration verified but pending approval");
		return redirect(`/c/${slug}/events/${eventId}?verified=pending_approval`, { headers });
	}

	// Get event details
	console.log("Fetching event details");
	const { data: event, error: eventError } = await supabase
		.from("events")
		.select("*")
		.eq("id", eventId)
		.single();

	if (eventError || !event) {
		console.error("Error fetching event:", eventError);
		// Verification was successful, so still redirect
		return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
	}

	// Get community details
	console.log("Fetching community details");
	const { data: community, error: communityError } = await supabase
		.from("communities")
		.select("*")
		.eq("id", event.community_id)
		.single();

	if (communityError || !community) {
		console.error("Error fetching community:", communityError);
		// Verification was successful, so still redirect
		return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
	}

	// Send confirmation email (subscription for external events, registration for native)
	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventLink = `${url.origin}/c/${slug}/events/${eventId}`;
	const registerAccountLink = `${url.origin}/signup`;
	const isExternalEvent = event.registration_type === "external";

	try {
		if (isExternalEvent) {
			console.log("Sending subscription confirmation email");
			const externalPlatformName = getExternalPlatformName(
				(event.external_platform as ExternalPlatform) || "other"
			);
			await sendSubscriptionConfirmationEmail({
				eventTitle: event.title,
				communityName: community.name,
				eventDate: eventDate.format("dddd, MMMM D, YYYY"),
				eventTime: eventDate.format("h:mm A z"),
				eventLink,
				externalRegistrationUrl: event.external_registration_url || "",
				externalPlatformName,
				recipientName: registration.anonymous_name || "there",
				recipientEmail: registration.anonymous_email || "",
				registerAccountLink,
				locationAddress: event.location_address || undefined,
				onlineMeetingLink: event.online_meeting_link || undefined,
			});
			console.log("Subscription confirmation email sent successfully");
		} else {
			console.log("Sending registration confirmation email");
			await sendRegistrationConfirmationEmail({
				eventTitle: event.title,
				communityName: community.name,
				eventDate: eventDate.format("dddd, MMMM D, YYYY"),
				eventTime: eventDate.format("h:mm A z"),
				eventLink,
				recipientName: registration.anonymous_name || "there",
				recipientEmail: registration.anonymous_email || "",
				registerAccountLink,
				locationAddress: event.location_address || undefined,
				onlineMeetingLink: event.online_meeting_link || undefined,
				startTimeISO: event.start_time,
				endTimeISO: event.end_time || event.start_time,
			});
			console.log("Registration confirmation email sent successfully");
		}
	} catch (error) {
		console.error("Failed to send confirmation email:", error);
		// Continue anyway - verification was successful
	}

	// Redirect to event page with success message
	return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
}

