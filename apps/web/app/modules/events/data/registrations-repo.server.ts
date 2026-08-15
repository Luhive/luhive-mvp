import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";

type DbClient = SupabaseClient<Database>;

/** Count of confirmed attendees (verified, going, approved) for an event. */
export async function getApprovedRegistrationCount(
	client: DbClient,
	eventId: string,
): Promise<number> {
	const { count } = await client
		.from("event_registrations")
		.select("*", { count: "exact", head: true })
		.eq("event_id", eventId)
		.eq("is_verified", true)
		.eq("rsvp_status", "going")
		.eq("approval_status", "approved");

	return count || 0;
}
