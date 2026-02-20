import type {
  Event,
  EventRegistration,
  EventStatus,
} from "~/shared/models/entity.types";
import { createClient as createBrowserClient } from "~/shared/lib/supabase/client";

export async function getEventsByCommunityClient(
  communityId: string,
  options?: {
    status?: string;
    startTimeGte?: string;
    startTimeLt?: string;
    order?: { column: "start_time"; ascending: boolean };
    limit?: number;
  },
) {
  const supabase = createBrowserClient();

  let query = supabase
    .from("events")
    .select("*")
    .eq("community_id", communityId);

  if (options?.status) {
    query = query.eq("status", options.status as EventStatus);
  }
  if (options?.startTimeGte) {
    query = query.gte("start_time", options.startTimeGte);
  }
  if (options?.startTimeLt) {
    query = query.lt("start_time", options.startTimeLt);
  }

  query = query.order(options?.order?.column ?? "start_time", {
    ascending: options?.order?.ascending ?? false,
  });

  if (typeof options?.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  return { events: (data || []) as Event[], error };
}

export async function getEventByIdClient(
  eventId: string,
  communityId?: string,
) {
  const supabase = createBrowserClient();

  let query = supabase.from("events").select("*").eq("id", eventId);

  if (communityId) {
    query = query.eq("community_id", communityId);
  }

  const { data, error } = await query.single();

  return { event: data as Event | null, error };
}

export async function getEventCustomQuestionsClient(eventId: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("events")
    .select("custom_questions")
    .eq("id", eventId)
    .single();

  return { custom_questions: data?.custom_questions ?? null, error };
}

export async function getEventRegistrationCountClient(
  eventId: string,
  options?: { approvedOnly?: boolean },
) {
  const supabase = createBrowserClient();

  let query = supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (options?.approvedOnly) {
    query = query.eq("approval_status", "approved");
  }

  const { count, error } = await query;

  return { count: count ?? 0, error };
}

export async function getEventRegistrationsClient(eventId: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      `
      id,
      user_id,
      anonymous_name,
      anonymous_email,
      anonymous_phone,
      rsvp_status,
      approval_status,
      is_verified,
      registered_at,
      custom_answers,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  return {
    registrations: (data || []) as EventRegistration[],
    error,
  };
}

/**
 * Fetches events for a community and attaches registration counts.
 * Uses 2 queries total (events + all registrations) instead of N+1.
 *
 * Mirrors existing dashboard behavior:
 * - if event.is_approve_required => count only approved registrations
 * - else => count all registrations
 */
export async function getEventsWithRegistrationCountsClient(
  communityId: string,
) {
  const supabase = createBrowserClient();

  const { data: eventsData, error } = await supabase
    .from("events")
    .select("*")
    .eq("community_id", communityId)
    .order("start_time", { ascending: false });

  if (error) {
    return { events: [] as (Event & { registration_count?: number })[], error };
  }

  const events = eventsData || [];
  if (events.length === 0) {
    return { events: [], error: null };
  }

  const eventIds = events.map((e) => e.id);
  const { data: regs } = await supabase
    .from("event_registrations")
    .select("event_id, approval_status")
    .in("event_id", eventIds);

  const byEvent = (regs || []).reduce(
    (acc, r) => {
      if (!acc[r.event_id]) acc[r.event_id] = [];
      acc[r.event_id].push(r);
      return acc;
    },
    {} as Record<
      string,
      { event_id: string; approval_status: string | null }[]
    >,
  );

  const eventsWithCounts = events.map((event) => {
    const regsForEvent = byEvent[event.id] || [];
    const count = event.is_approve_required
      ? regsForEvent.filter((r) => r.approval_status === "approved").length
      : regsForEvent.length;
    return { ...event, registration_count: count };
  });

  return { events: eventsWithCounts, error: null };
}

export async function deleteEventClient(eventId: string, communityId: string) {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("community_id", communityId);

  return { error };
}

export async function updateEventStatusClient(
  eventId: string,
  communityId: string,
  status: Extract<EventStatus, "draft" | "published">,
) {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("community_id", communityId);

  return { error };
}
