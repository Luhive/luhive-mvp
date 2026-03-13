import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";

type CheckinSupabase = SupabaseClient<Database>;

export async function getRegistrationByCheckinToken(
  supabase: CheckinSupabase,
  token: string,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      `
      id,
      approval_status,
      is_attended,
      anonymous_name,
      user_id,
      profiles ( full_name )
    `
    )
    .eq("checkin_token", token)
    .eq("event_id", eventId)
    .single();

  return { registration: data, error };
}

export async function markAttended(
  supabase: CheckinSupabase,
  registrationId: string
) {
  const attendedAt = new Date().toISOString();
  const { error } = await supabase
    .from("event_registrations")
    .update({ is_attended: true, attended_at: attendedAt })
    .eq("id", registrationId);

  return { attendedAt, error };
}
