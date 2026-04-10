import type { ActionFunctionArgs } from "react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import { notifyNewEvent } from "~/modules/events/server/notify-new-event.server";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const debugToken = request.headers.get("X-Debug-Token");
  if (!debugToken || debugToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return new Response("Missing eventId", { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    const { data: event } = await serviceClient
      .from("events")
      .select(`
        id,
        title,
        start_time,
        timezone,
        community_id,
        location_address,
        online_meeting_link,
        communities!inner ( slug )
      `)
      .eq("id", eventId)
      .single();

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const communitySlug = (event.communities as any)?.slug;
    const eventStart = dayjs.tz(event.start_time, event.timezone);

    await notifyNewEvent({
      eventId: event.id,
      communityId: event.community_id,
      eventTitle: event.title,
      eventDate: eventStart.format("dddd, MMMM D, YYYY"),
      eventTime: eventStart.format("h:mm A z"),
      eventLink: `https://luhive.com/c/${communitySlug}/events/${event.id}`,
      locationAddress: event.location_address ?? undefined,
      onlineMeetingLink: event.online_meeting_link ?? undefined,
    });

    return { success: true, eventId };
  } catch (error) {
    console.error("Error in new-event-notification debug API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
