import type { ActionFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { saveEventReminders } from "~/modules/events/server/event-reminders.server";
import type { Database, Json } from "~/shared/models/database.types";

type EventType = Database["public"]["Enums"]["event_type"];
type EventStatus = Database["public"]["Enums"]["event_status"];
type ReminderTime = Database["public"]["Enums"]["reminder_time"];

export interface EventUpdatePayload {
  eventId: string;
  communityId: string;
  communitySlug: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  timezone: string;
  eventType: EventType;
  locationAddress?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlaceId?: string | null;
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
}

export interface EventUpdateResult {
  success: true;
  eventId: string;
  communitySlug: string;
  status: string;
}

export interface EventUpdateError {
  success: false;
  error: string;
}

export async function eventUpdateAction({
  request,
}: ActionFunctionArgs): Promise<EventUpdateResult | EventUpdateError | Response> {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  let payload: EventUpdatePayload;
  try {
    payload = await request.json();
  } catch {
    return { success: false, error: "Invalid request body" };
  }

  const {
    eventId,
    communityId,
    communitySlug,
    title,
    description,
    startTime,
    endTime,
    timezone,
    eventType,
    locationAddress,
    locationName,
    locationLat,
    locationLng,
    locationPlaceId,
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
  } = payload;

  // Verify caller is host community
  const { data: collaboration } = await supabase
    .from("event_collaborations")
    .select("role")
    .eq("event_id", eventId)
    .eq("community_id", communityId)
    .eq("role", "host")
    .eq("status", "accepted")
    .single();

  if (!collaboration) {
    return { success: false, error: "Only host community can update event details" };
  }

  const { error: eventError } = await supabase
    .from("events")
    .update({
      community_id: communityId,
      title,
      description: description || null,
      start_time: startTime,
      end_time: endTime || null,
      timezone,
      event_type: eventType,
      location_address: locationAddress || null,
      location_name: locationName || null,
      location_lat: locationLat ?? null,
      location_lng: locationLng ?? null,
      location_place_id: locationPlaceId || null,
      online_meeting_link: onlineMeetingLink || null,
      discussion_link: discussionLink?.trim() || null,
      capacity: capacity || null,
      registration_deadline: registrationDeadline || null,
      cover_url: coverUrl || null,
      status,
      is_approve_required: isApproveRequired,
      custom_questions: (customQuestions ?? null) as Json | null,
    })
    .eq("id", eventId);

  if (eventError) {
    console.error("Error updating event:", eventError);
    return { success: false, error: eventError.message || "Failed to update event" };
  }

  await saveEventReminders(eventId, reminderTimes ?? [], reminderMessage ?? null);

  return { success: true, eventId, communitySlug, status };
}
