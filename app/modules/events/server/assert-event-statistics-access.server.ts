import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventStatisticsEvent } from "~/modules/events/model/event-statistics.types";
import type { Database } from "~/shared/models/database.types";

type SessionSupabase = SupabaseClient<Database>;

type AccessSuccess = { event: EventStatisticsEvent };
type AccessFailure = { error: string; status: 403 | 404 };

async function isCommunityOwnerOrAdmin(
  supabase: SessionSupabase,
  communityId: string,
  userId: string,
): Promise<boolean> {
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single();

  if (community?.created_by === userId) {
    return true;
  }

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single();

  return membership?.role === "owner" || membership?.role === "admin";
}

async function resolveEventForCommunity(
  supabase: SessionSupabase,
  eventId: string,
  communityId: string,
): Promise<EventStatisticsEvent | null> {
  const { data: hostEvent } = await supabase
    .from("events")
    .select("id, title, start_time, cover_url")
    .eq("id", eventId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (hostEvent) {
    return {
      id: hostEvent.id,
      title: hostEvent.title,
      start_time: hostEvent.start_time,
      cover_url: hostEvent.cover_url,
    };
  }

  const { data: coHostCollaboration, error: collaborationError } = await supabase
    .from("event_collaborations")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("community_id", communityId)
    .eq("status", "accepted")
    .eq("role", "co-host")
    .maybeSingle();

  if (collaborationError || !coHostCollaboration) {
    return null;
  }

  const { data: eventByCollab, error: eventByCollabError } = await supabase
    .from("events")
    .select("id, title, start_time, cover_url")
    .eq("id", eventId)
    .single();

  if (eventByCollabError || !eventByCollab) {
    return null;
  }

  return {
    id: eventByCollab.id,
    title: eventByCollab.title,
    start_time: eventByCollab.start_time,
    cover_url: eventByCollab.cover_url,
  };
}

export async function assertEventStatisticsAccess(
  supabase: SessionSupabase,
  userId: string,
  eventId: string,
  communityId: string,
): Promise<AccessSuccess | AccessFailure> {
  const isAdmin = await isCommunityOwnerOrAdmin(supabase, communityId, userId);
  if (!isAdmin) {
    return { error: "forbidden", status: 403 };
  }

  const event = await resolveEventForCommunity(supabase, eventId, communityId);
  if (!event) {
    return { error: "not_found", status: 404 };
  }

  return { event };
}
