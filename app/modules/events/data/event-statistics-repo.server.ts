import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EventRegistrationStatRow,
  EventStatisticsPayload,
  EventVisitStatRow,
} from "~/modules/events/model/event-statistics.types";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";
import type { Database } from "~/shared/models/database.types";

type StatisticsSupabase = SupabaseClient<Database>;

export async function getEventStatisticsPayload(
  serviceClient: StatisticsSupabase,
  eventId: string,
): Promise<{ payload: EventStatisticsPayload | null; error: Error | null }> {
  const { data: eventRow, error: eventError } = await serviceClient
    .from("events")
    .select("id, title, start_time, cover_url")
    .eq("id", eventId)
    .single();

  if (eventError || !eventRow) {
    return {
      payload: null,
      error: (eventError as unknown as Error) || new Error("Event not found"),
    };
  }

  const [visitsResult, registrationsResult] = await Promise.all([
    (serviceClient as unknown as { from: (table: string) => ReturnType<StatisticsSupabase["from"]> })
      .from("event_visits")
      .select("visited_at, session_id, utm_source, country, city")
      .eq("event_id", eventId)
      .order("visited_at", { ascending: true }),
    (serviceClient as unknown as { from: (table: string) => ReturnType<StatisticsSupabase["from"]> })
      .from("event_registrations")
      .select(
        "registered_at, registration_session_id, utm_source, time_to_register_seconds",
      )
      .eq("event_id", eventId)
      .eq("is_verified", true)
      .eq("rsvp_status", "going")
      .order("registered_at", { ascending: true }),
  ]);

  if (visitsResult.error) {
    return { payload: null, error: visitsResult.error as Error };
  }

  if (registrationsResult.error) {
    return { payload: null, error: registrationsResult.error as Error };
  }

  const visits: EventVisitStatRow[] = ((visitsResult.data || []) as EventVisitStatRow[]).map(
    (row) => ({
      ...row,
      utm_source: normalizeUtmSource(row.utm_source),
    }),
  );

  const registrations: EventRegistrationStatRow[] = (
    (registrationsResult.data || []) as EventRegistrationStatRow[]
  ).map((row) => ({
    ...row,
    utm_source: normalizeUtmSource(row.utm_source),
  }));

  return {
    payload: {
      event: {
        id: eventRow.id,
        title: eventRow.title,
        start_time: eventRow.start_time,
        cover_url: eventRow.cover_url,
      },
      visits,
      registrations,
    },
    error: null,
  };
}
