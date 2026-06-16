import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { Database } from "~/shared/models/database.types";

type ReminderTime = Database["public"]["Enums"]["reminder_time"];

export async function upsertEventReminders(
  eventId: string,
  reminderTimes: ReminderTime[],
  customMessage: string | null,
) {
  const supabase = createServiceRoleClient();
  return supabase
    .from("event_reminders")
    .upsert(
      { event_id: eventId, reminder_times: reminderTimes, custom_message: customMessage },
      { onConflict: "event_id" },
    );
}

export async function deleteEventReminders(eventId: string) {
  const supabase = createServiceRoleClient();
  return supabase.from("event_reminders").delete().eq("event_id", eventId);
}

export async function saveEventReminders(
  eventId: string,
  reminderTimes: ReminderTime[],
  customMessage: string | null,
) {
  if (reminderTimes.length > 0) {
    const { error } = await upsertEventReminders(eventId, reminderTimes, customMessage);
    if (error) console.error("Error upserting event reminders:", error);
    return error;
  }

  const { error } = await deleteEventReminders(eventId);
  if (error) console.error("Error deleting event reminders:", error);
  return error;
}
