import type { ActionFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { notifyNewEvent } from "~/modules/events/server/notify-new-event.server";
import type { Database, Json } from "~/shared/models/database.types";

type EventType = Database["public"]["Enums"]["event_type"];
type EventStatus = Database["public"]["Enums"]["event_status"];
type ReminderTime = "1-hour" | "3-hours" | "1-day";

export interface EventCreatePayload {
  communityId: string;
  communitySlug: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  timezone: string;
  eventType: EventType;
  locationAddress?: string | null;
  onlineMeetingLink?: string | null;
  discussionLink?: string | null;
  capacity?: number | null;
  registrationDeadline?: string | null;
  coverUrl?: string | null;
  status: EventStatus;
  isApproveRequired: boolean;
  customQuestions?: Json | null;
  reminderTimes?: ReminderTime[];
  reminderMessage?: string | null;
  eventDate: string;
  eventTime: string;
  eventLinkBase: string;
}

export interface EventCreateResult {
  success: true;
  eventId: string;
  communitySlug: string;
}

export interface EventCreateError {
  success: false;
  error: string;
}

export async function eventCreateAction({
  request,
}: ActionFunctionArgs): Promise<EventCreateResult | EventCreateError | Response> {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  let payload: EventCreatePayload;
  try {
    payload = await request.json();
  } catch {
    return { success: false, error: "Invalid request body" };
  }

  const {
    communityId,
    communitySlug,
    title,
    description,
    startTime,
    endTime,
    timezone,
    eventType,
    locationAddress,
    onlineMeetingLink,
    discussionLink,
    capacity,
    registrationDeadline,
    coverUrl,
    status,
    isApproveRequired,
    customQuestions,
    reminderTimes,
    reminderMessage,
    eventDate,
    eventTime,
    eventLinkBase,
  } = payload;

  const { data: newEvent, error: eventError } = await supabase
    .from("events")
    .insert({
      community_id: communityId,
      created_by: user.id,
      title,
      description: description || null,
      start_time: startTime,
      end_time: endTime || null,
      timezone,
      event_type: eventType,
      location_address: locationAddress || null,
      online_meeting_link: onlineMeetingLink || null,
      discussion_link: discussionLink?.trim() || null,
      capacity: capacity || null,
      registration_deadline: registrationDeadline || null,
      cover_url: coverUrl || null,
      status,
      is_approve_required: isApproveRequired,
      custom_questions: (customQuestions ?? null) as Json | null,
    })
    .select("id")
    .single();

  if (eventError || !newEvent) {
    console.error("Error creating event:", eventError);
    return { success: false, error: eventError?.message || "Failed to create event" };
  }

  const { error: collabError } = await supabase.from("event_collaborations").insert({
    event_id: newEvent.id,
    community_id: communityId,
    role: "host",
    status: "accepted",
    invited_by: user.id,
    invited_at: new Date().toISOString(),
    accepted_at: new Date().toISOString(),
  });

  if (collabError) {
    console.error("Error creating host collaboration:", collabError);
  }

  if (reminderTimes && reminderTimes.length > 0) {
    const { error: reminderError } = await supabase.from("event_reminders").insert({
      event_id: newEvent.id,
      reminder_times: reminderTimes,
      custom_message: reminderMessage || null,
    });

    if (reminderError) {
      console.error("Error creating event reminders:", reminderError);
    }
  }

  if (status === "published") {
    try {
      await notifyNewEvent({
        eventId: newEvent.id,
        communityId,
        eventTitle: title,
        eventDate,
        eventTime,
        eventLink: `${eventLinkBase}/c/${communitySlug}/events/${newEvent.id}`,
        locationAddress: locationAddress || undefined,
        onlineMeetingLink: onlineMeetingLink || undefined,
      });
    } catch (notifyError) {
      console.error("Failed to send new event notification emails:", notifyError);
    }
  }

  return { success: true, eventId: newEvent.id, communitySlug };
}
