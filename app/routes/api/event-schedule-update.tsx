import { createClient, createServiceRoleClient } from "~/lib/supabase.server";
import type { Route } from "./+types/event-schedule-update";
import { sendEventScheduleUpdateEmail } from "~/lib/email.server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const { supabase } = createClient(request);

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { eventId } = body as { eventId?: string };

  if (!eventId) {
    return Response.json(
      { success: false, error: "Missing required field: eventId" },
      { status: 400 }
    );
  }

  try {
    const serviceClient = createServiceRoleClient();

    // Fetch event with community
    const { data: event, error: eventError } = await serviceClient
      .from("events")
      .select("*, community_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event for schedule update:", eventError);
      return Response.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Check permissions: user must be owner/admin of the community
    const { data: membership, error: membershipError } = await serviceClient
      .from("community_members")
      .select("role")
      .eq("community_id", event.community_id)
      .eq("user_id", user.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !["owner", "admin"].includes((membership as any).role || "")
    ) {
      return Response.json(
        { success: false, error: "You do not have permission to manage this event" },
        { status: 403 }
      );
    }

    // Fetch community for name + slug
    const { data: community, error: communityError } = await serviceClient
      .from("communities")
      .select("slug, name")
      .eq("id", event.community_id)
      .single();

    if (communityError || !community) {
      console.error("Error fetching community for schedule update:", communityError);
      return Response.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    // Build event link
    const url = new URL(request.url);
    const eventLink = `${url.origin}/c/${community.slug}/events/${eventId}`;

    // Format date/time using event timezone
    const eventDateTime = dayjs(event.start_time).tz(event.timezone);
    const eventDateFormatted = eventDateTime.format("dddd, MMMM D, YYYY");
    const eventTimeFormatted = eventDateTime.format("h:mm A z");

    // Fetch verified "going" registrations (approved or no approval required)
    const { data: registrations, error: regError } = await serviceClient
      .from("event_registrations")
      .select(
        `
        id,
        user_id,
        anonymous_name,
        anonymous_email,
        is_verified,
        rsvp_status,
        approval_status,
        profiles (
          full_name
        )
      `
      )
      .eq("event_id", eventId)
      .eq("is_verified", true)
      .eq("rsvp_status", "going")
      .or("approval_status.is.null,approval_status.eq.approved");

    if (regError) {
      console.error("Error fetching registrations for schedule update:", regError);
      return Response.json(
        { success: false, error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    const registerAccountLink = `${url.origin}/signup`;

    // For each registration, resolve email + name and send email
    for (const reg of registrations || []) {
      let recipientEmail: string | null = reg.anonymous_email || null;
      let recipientName: string =
        reg.anonymous_name || reg.profiles?.full_name || "there";

      // If no anonymous email but user_id exists, try to fetch from auth
      if (!recipientEmail && reg.user_id) {
        const { data: userResult, error: userError } =
          await serviceClient.auth.admin.getUserById(reg.user_id);

        if (!userError && userResult?.user?.email) {
          recipientEmail = userResult.user.email;
          recipientName = reg.profiles?.full_name || recipientName || "there";
        }
      }

      if (!recipientEmail) {
        continue;
      }

      await sendEventScheduleUpdateEmail({
        eventTitle: event.title,
        communityName: community.name,
        eventDate: eventDateFormatted,
        eventTime: eventTimeFormatted,
        eventLink,
        recipientName,
        recipientEmail,
        locationAddress: event.location_address || undefined,
        onlineMeetingLink: event.online_meeting_link || undefined,
      });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in api/event-schedule-update:", error);
    return Response.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

