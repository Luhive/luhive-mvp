import type { ActionFunctionArgs } from "react-router";
import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import { sendEventScheduleUpdateEmail } from "~/shared/lib/email.server";
import { sendEventReminderEmail } from "~/shared/lib/email.server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  // Optional simple secret check to avoid public invocation
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.SERVICE_WORKER_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const serviceClient = createServiceRoleClient();

    // First, enqueue reminders for events that have notification timings
    await serviceClient.rpc("enqueue_event_reminders");

    // Then, fetch due reminders that are not sent
    const { data: reminders, error: remError } = await serviceClient
      .from("event_reminders")
      .select("id, event_id, send_at, send_offset, message")
      .lte("send_at", new Date().toISOString())
      .eq("sent", false)
      .limit(500);

    if (remError) {
      console.error("Failed to fetch due reminders:", remError);
      return Response.json({ success: false, error: "Failed to fetch reminders" }, { status: 500 });
    }

    for (const rem of reminders || []) {
      try {
        // Fetch event and community
        const { data: event } = await serviceClient
          .from("events")
          .select("*, communities:communities!events_community_id_fkey(id, name, slug), timezone")
          .eq("id", rem.event_id)
          .single();

        if (!event) {
          console.warn("Event not found for reminder", rem.id);
          continue;
        }

        const community = (event as any).communities || { id: event.community_id, name: "" };

        // Find recipients: verified registrations who are going and approved
        const { data: registrations } = await serviceClient
          .from("event_registrations")
          .select(`
            id,
            user_id,
            anonymous_name,
            anonymous_email,
            profiles ( full_name )
          `)
          .eq("event_id", rem.event_id)
          .eq("is_verified", true)
          .eq("rsvp_status", "going")
          .eq("approval_status", "approved");

        for (const reg of registrations || []) {
          let recipientEmail: string | null = reg.anonymous_email || null;
          let recipientName: string = reg.anonymous_name || (reg as any).profiles?.full_name || "there";

          if (!recipientEmail && reg.user_id) {
            const { data: userResult } = await serviceClient.auth.admin.getUserById(reg.user_id);
            if (userResult?.user?.email) {
              recipientEmail = userResult.user.email;
              recipientName = (reg as any).profiles?.full_name || recipientName || "there";
            }
          }
          if (!recipientEmail) continue;

          const url = new URL(request.url);
          const eventLink = `${url.origin}/c/${community.slug}/events/${rem.event_id}`;

          const eventDateTime = dayjs(event.start_time).tz(event.timezone);
          const eventDateFormatted = eventDateTime.format("dddd, MMMM D, YYYY");
          const eventTimeFormatted = eventDateTime.format("h:mm A z");

          // Use reminder message if provided, otherwise generate a default message
          const message = rem.message || `Reminder: "${event.title}" starts on ${eventDateTime.format("MMM D, YYYY [at] HH:mm")}`;

          await sendEventReminderEmail({
            eventTitle: event.title,
            communityName: community.name,
            eventDate: eventDateFormatted,
            eventTime: eventTimeFormatted,
            eventLink,
            recipientName,
            recipientEmail,
            message,
          });
        }

        // Mark reminder as sent
        await serviceClient
          .from("event_reminders")
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq("id", rem.id);
      } catch (err) {
        console.error("Error processing reminder", rem.id, err);
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in process-reminders:", error);
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
