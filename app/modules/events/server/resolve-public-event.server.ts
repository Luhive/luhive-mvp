import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import type { Community, Event } from "~/shared/models/entity.types";
import { isUuid } from "~/modules/events/utils/event-slug";

type Supabase = SupabaseClient<Database>;

export const PUBLIC_COMMUNITY_COLUMNS =
  "id, name, slug, logo_url, created_by, description, tagline, cover_url, verified, is_show, social_links";

export const PUBLIC_EVENT_COLUMNS =
  "id, slug, community_id, title, description, cover_url, start_time, end_time, timezone, status, capacity, registration_deadline, registration_type, custom_questions, external_platform, external_registration_url, event_type, location_address, location_lat, location_lng, location_name, location_place_id, online_meeting_link, discussion_link, is_approve_required, created_by, created_at, updated_at, external_registration_count";

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
  const lookupId = isUuid(eventSlug) ? eventSlug : null;

  const [{ data: community, error: communityError }, { data: event }] =
    await Promise.all([
      supabase
        .from("communities")
        .select(PUBLIC_COMMUNITY_COLUMNS)
        .eq("slug", communitySlug)
        .single(),
      lookupId
        ? supabase
            .from("events")
            .select(PUBLIC_EVENT_COLUMNS)
            .eq("id", lookupId)
            .maybeSingle()
        : supabase
            .from("events")
            .select(PUBLIC_EVENT_COLUMNS)
            .eq("slug", eventSlug)
            .maybeSingle(),
    ]);

  if (communityError || !community) {
    return null;
  }

  if (!event) {
    return null;
  }

  if (options?.publishedOnly && event.status !== "published") {
    return null;
  }

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

  return {
    event: event as Event,
    community: community as Community,
  };
}
