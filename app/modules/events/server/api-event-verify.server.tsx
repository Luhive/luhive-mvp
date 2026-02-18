import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { sendRegistrationConfirmationEmail, sendSubscriptionConfirmationEmail } from "~/shared/lib/email.server";
import { getExternalPlatformName } from "~/modules/events/utils/external-platform";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function loader({ request, params }: LoaderFunctionArgs) {
	const { headers } = createClient(request);
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

	const { data: registration, error: findError } = await supabase
		.from("event_registrations")
		.select("*")
		.eq("verification_token", token)
		.maybeSingle();

	if (findError) {
		throw new Response("Database error", { status: 500 });
	}
	if (!registration) {
		throw new Response("Invalid or expired verification link", { status: 400 });
	}
	if (registration.event_id !== eventId) {
		throw new Response("Invalid verification link for this event", { status: 400 });
	}

	const tokenExpiresAt = registration.token_expires_at ? new Date(registration.token_expires_at) : null;
	if (tokenExpiresAt && new Date() > tokenExpiresAt) {
		throw new Response("Verification link has expired", { status: 400 });
	}

	if (registration.is_verified) {
		return redirect(`/c/${slug}/events/${eventId}?verified=already`, { headers });
	}

	const { error: updateError } = await supabase
		.from("event_registrations")
		.update({ is_verified: true, verification_token: null, token_expires_at: null })
		.eq("id", registration.id);

	if (updateError) {
		throw new Response("Failed to verify registration", { status: 500 });
	}

	if (registration.approval_status === "pending") {
		return redirect(`/c/${slug}/events/${eventId}?verified=pending_approval`, { headers });
	}

	const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single();
	if (eventError || !event) {
		return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
	}

	const { data: community, error: communityError } = await supabase.from("communities").select("*").eq("id", event.community_id).single();
	if (communityError || !community) {
		return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
	}

	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventLink = `${url.origin}/c/${slug}/events/${eventId}`;
	const registerAccountLink = `${url.origin}/signup`;
	const isExternalEvent = event.registration_type === "external";

	try {
		if (isExternalEvent) {
			const externalPlatformName = getExternalPlatformName((event.external_platform as ExternalPlatform) || "other");
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
		} else {
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
		}
	} catch (error) {
		console.error("Failed to send confirmation email:", error);
	}

	return redirect(`/c/${slug}/events/${eventId}?verified=success`, { headers });
}
