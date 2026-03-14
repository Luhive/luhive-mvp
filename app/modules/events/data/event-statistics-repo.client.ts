import { createClient } from "~/shared/lib/supabase/client";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";

export type EventVisitStatRow = {
  visited_at: string;
  session_id: string;
  utm_source: string | null;
  country: string | null;
  city: string | null;
};

export type EventRegistrationStatRow = {
  registered_at: string | null;
  registration_session_id: string | null;
  utm_source: string | null;
  time_to_register_seconds: number | null;
};

export type EventStatisticsPayload = {
  event: {
    id: string;
    title: string;
    start_time: string;
  };
  visits: EventVisitStatRow[];
  registrations: EventRegistrationStatRow[];
};

export async function getEventStatisticsPayloadClient(
  eventId: string,
  communityId: string,
): Promise<{ payload: EventStatisticsPayload | null; error: Error | null }> {
  const supabase = createClient();

  const { data: hostEvent, error: hostEventError } = await (supabase as any)
    .from("events")
    .select("id, title, start_time, community_id")
    .eq("id", eventId)
    .eq("community_id", communityId)
    .maybeSingle();

  let eventRow: { id: string; title: string; start_time: string } | null = hostEvent
    ? {
        id: hostEvent.id,
        title: hostEvent.title,
        start_time: hostEvent.start_time,
      }
    : null;

  if (!eventRow && !hostEventError) {
    const { data: coHostCollaboration, error: collaborationError } = await supabase
      .from("event_collaborations")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("community_id", communityId)
      .eq("status", "accepted")
      .eq("role", "co-host")
      .maybeSingle();

    if (collaborationError) {
      return { payload: null, error: collaborationError as unknown as Error };
    }

    if (coHostCollaboration) {
      const { data: eventByCollab, error: eventByCollabError } = await (supabase as any)
        .from("events")
        .select("id, title, start_time")
        .eq("id", eventId)
        .single();

      if (eventByCollabError || !eventByCollab) {
        return {
          payload: null,
          error: (eventByCollabError as unknown as Error) || new Error("Event not found"),
        };
      }

      eventRow = {
        id: eventByCollab.id,
        title: eventByCollab.title,
        start_time: eventByCollab.start_time,
      };
    }
  }

  if (!eventRow) {
    return {
      payload: null,
      error: (hostEventError as unknown as Error) || new Error("Event not found or unauthorized"),
    };
  }

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 30);

  const [visitsResult, registrationsResult] = await Promise.all([
    (supabase as any)
      .from("event_visits")
      .select("visited_at, session_id, utm_source, country, city")
      .eq("event_id", eventId)
      .gte("visited_at", rangeStart.toISOString())
      .order("visited_at", { ascending: true }),
    (supabase as any)
      .from("event_registrations")
      .select("registered_at, registration_session_id, utm_source, time_to_register_seconds")
      .eq("event_id", eventId)
      .eq("is_verified", true)
      .eq("rsvp_status", "going")
      .gte("registered_at", rangeStart.toISOString())
      .order("registered_at", { ascending: true }),
  ]);

  if (visitsResult.error) {
    return { payload: null, error: visitsResult.error as Error };
  }

  if (registrationsResult.error) {
    return { payload: null, error: registrationsResult.error as Error };
  }

  const visits: EventVisitStatRow[] = (visitsResult.data || []).map((row: EventVisitStatRow) => ({
    ...row,
    utm_source: normalizeUtmSource(row.utm_source),
  }));

  const registrations: EventRegistrationStatRow[] =
    (registrationsResult.data || []).map((row: EventRegistrationStatRow) => ({
      ...row,
      utm_source: normalizeUtmSource(row.utm_source),
    }));

  return {
    payload: {
      event: {
        id: eventRow.id,
        title: eventRow.title,
        start_time: eventRow.start_time,
      },
      visits,
      registrations,
    },
    error: null,
  };
}
