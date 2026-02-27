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

  // Get events where community is host (community_id matches)
  let hostQuery = supabase
    .from("events")
    .select("*")
    .eq("community_id", communityId);

  if (options?.status) {
    hostQuery = hostQuery.eq("status", options.status as EventStatus);
  }
  if (options?.startTimeGte) {
    hostQuery = hostQuery.gte("start_time", options.startTimeGte);
  }
  if (options?.startTimeLt) {
    hostQuery = hostQuery.lt("start_time", options.startTimeLt);
  }

  // Get events where community is co-host (via event_collaborations)
  let coHostQuery = supabase
    .from("event_collaborations")
    .select(
      `
      event:events!event_collaborations_event_id_fkey (*)
    `
    )
    .eq("community_id", communityId)
    .eq("role", "co-host")
    .eq("status", "accepted");

  if (options?.status) {
    coHostQuery = coHostQuery.eq("event.status", options.status as EventStatus);
  }
  if (options?.startTimeGte) {
    coHostQuery = coHostQuery.gte("event.start_time", options.startTimeGte);
  }
  if (options?.startTimeLt) {
    coHostQuery = coHostQuery.lt("event.start_time", options.startTimeLt);
  }

  // Execute both queries
  const [hostResult, coHostResult] = await Promise.all([
    hostQuery,
    coHostQuery,
  ]);

  // Combine results
  const hostEvents = (hostResult.data || []) as Event[];
  const coHostEvents = (coHostResult.data || [])
    .map((item: { event: Event | Event[] }) => {
      const event = Array.isArray(item.event) ? item.event[0] : item.event;
      return event;
    })
    .filter((event: Event | null) => event !== null) as Event[];

  // Merge and deduplicate by event ID
  const eventMap = new Map<string, Event>();
  [...hostEvents, ...coHostEvents].forEach((event) => {
    if (event && event.id) {
      eventMap.set(event.id, event);
    }
  });

  let allEvents = Array.from(eventMap.values());

  // Apply ordering
  const orderColumn = options?.order?.column ?? "start_time";
  const ascending = options?.order?.ascending ?? false;
  allEvents.sort((a, b) => {
    const aVal = a[orderColumn];
    const bVal = b[orderColumn];
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });

  // Apply limit
  if (typeof options?.limit === "number") {
    allEvents = allEvents.slice(0, options.limit);
  }

  return { events: allEvents, error: hostResult.error || coHostResult.error };
}

export async function getEventByIdClient(
  eventId: string,
  communityId?: string,
) {
  const supabase = createBrowserClient();

  let query = supabase
    .from("events")
    .select("*, event_reminders(reminder_times, custom_message)")
    .eq("id", eventId);

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

  // Get events where community is host
  const { data: hostEventsData, error: hostError } = await supabase
    .from("events")
    .select("*")
    .eq("community_id", communityId);

  // Get events where community is co-host
  const { data: coHostData, error: coHostError } = await supabase
    .from("event_collaborations")
    .select(
      `
      event:events!event_collaborations_event_id_fkey (*)
    `
    )
    .eq("community_id", communityId)
    .eq("role", "co-host")
    .eq("status", "accepted");

  if (hostError || coHostError) {
    return { events: [] as (Event & { registration_count?: number; communityRole?: "host" | "co-host" })[], error: hostError || coHostError };
  }

  // Track host events with role
  const hostEvents = ((hostEventsData || []) as Event[]).map((event) => ({
    ...event,
    communityRole: "host" as const,
  }));

  // Track co-host events with role
  const coHostEvents = (coHostData || [])
    .map((item: { event: Event | Event[] }) => {
      const event = Array.isArray(item.event) ? item.event[0] : item.event;
      return event ? { ...event, communityRole: "co-host" as const } : null;
    })
    .filter((event: any) => event !== null);

  // Merge and deduplicate (host events take precedence if an event appears in both)
  const eventMap = new Map<string, any>();
  [...hostEvents, ...coHostEvents].forEach((event) => {
    if (event && event.id) {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, event);
      }
    }
  });

  const events = Array.from(eventMap.values());
  if (events.length === 0) {
    return { events: [], error: null };
  }

  // Get registration counts for all events
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

  const eventsWithCounts = events
    .map((event) => {
      const regsForEvent = byEvent[event.id] || [];
      const count = event.is_approve_required
        ? regsForEvent.filter((r) => r.approval_status === "approved").length
        : regsForEvent.length;
      return { ...event, registration_count: count };
    })
    .sort((a, b) => {
      const aTime = new Date(a.start_time).getTime();
      const bTime = new Date(b.start_time).getTime();
      return bTime - aTime; // Descending order
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

export async function getCommunityCollaborationInvitesClient(
  communityId: string,
) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      id,
      status,
      role,
      invited_at,
      event:events!event_collaborations_event_id_fkey (
        id,
        title,
        start_time,
        community_id,
        community:communities!events_community_id_fkey (id, name, slug)
      )
    `
    )
    .eq("community_id", communityId)
    .eq("status", "pending");

  return { invites: (data || []) as any[], error };
}

export async function updateEventStatusClient(
  eventId: string,
  communityId: string,
  status: Extract<EventStatus, "draft" | "published">,
) {
  const supabase = createBrowserClient();

  // Check if community is host (only host can update)
  const { data: collaboration } = await supabase
    .from("event_collaborations")
    .select("role")
    .eq("event_id", eventId)
    .eq("community_id", communityId)
    .eq("role", "host")
    .eq("status", "accepted")
    .single();

  if (!collaboration) {
    return { error: { message: "Only host community can update event status", code: "PERMISSION_DENIED" } };
  }

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("community_id", communityId);

  return { error };
}

/**
 * Check if a community can update an event (only host can update)
 */
export async function canUpdateEventClient(
  eventId: string,
  communityId: string,
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { data } = await supabase
    .from("event_collaborations")
    .select("role")
    .eq("event_id", eventId)
    .eq("community_id", communityId)
    .eq("role", "host")
    .eq("status", "accepted")
    .single();

  return !!data;
}
