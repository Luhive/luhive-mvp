import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import type { Community, Event } from "~/shared/models/entity.types";
import { isUuid } from "~/modules/events/utils/event-slug";

type Supabase = SupabaseClient<Database>;

export type ResolvedPublicEvent = {
  event: Event;
  community: Community;
};

/**
 * Resolve a public event from URL params: /c/:communitySlug/:eventSlug
 * Supports host community and accepted co-host community paths.
 */
export async function resolvePublicEvent(
  supabase: Supabase,
  communitySlug: string,
  eventSlug: string,
  options?: { publishedOnly?: boolean },
): Promise<ResolvedPublicEvent | null> {
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", communitySlug)
    .single();

  if (communityError || !community) {
    return null;
  }

  const lookupSlug = eventSlug;
  const lookupId = isUuid(eventSlug) ? eventSlug : null;

  let event: Event | null = null;

  if (lookupId) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", lookupId)
      .maybeSingle();
    event = data;
  } else {
    const { data: hostEvent } = await supabase
      .from("events")
      .select("*")
      .eq("slug", lookupSlug)
      .eq("community_id", community.id)
      .maybeSingle();

    if (hostEvent) {
      event = hostEvent;
    } else {
      const { data: coHostCollab } = await supabase
        .from("event_collaborations")
        .select("event_id")
        .eq("community_id", community.id)
        .eq("role", "co-host")
        .eq("status", "accepted");

      if (coHostCollab?.length) {
        const eventIds = coHostCollab.map((c) => c.event_id);
        const { data: coHostEvent } = await supabase
          .from("events")
          .select("*")
          .eq("slug", lookupSlug)
          .in("id", eventIds)
          .maybeSingle();
        event = coHostEvent;
      }
    }
  }

  if (!event) {
    return null;
  }

  if (options?.publishedOnly && event.status !== "published") {
    return null;
  }

  // Co-host path: verify this community is allowed to view the event
  if (event.community_id !== community.id) {
    const { data: collaboration } = await supabase
      .from("event_collaborations")
      .select("id")
      .eq("event_id", event.id)
      .eq("community_id", community.id)
      .eq("role", "co-host")
      .eq("status", "accepted")
      .maybeSingle();

    if (!collaboration) {
      return null;
    }
  }

  return { event, community };
}
