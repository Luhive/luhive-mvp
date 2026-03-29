import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import type { ProfileCommunityItem, ProfileEventItem } from "~/modules/profile/models/profile.types";

type Supabase = SupabaseClient<Database>;

export async function getProfileCommunities(
  supabase: Supabase,
  userId: string
): Promise<ProfileCommunityItem[]> {
  
  const { data } = await supabase
    .from("community_members")
    .select("role, communities(id, name, slug, logo_url, verified, community_members(count))")
    .eq("user_id", userId);

  if (!data) return [];

  return data
    .filter((row) => row.communities !== null)
    .map((row) => {
      const c = row.communities as any;
      const memberCount: number = c?.community_members?.[0]?.count ?? 0;
      return {
        role: row.role ?? "member",
        memberCount,
        community: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          logo_url: c.logo_url,
          verified: c.verified,
        } as ProfileCommunityItem["community"],
      };
    });
}

export async function getProfileEvents(
  supabase: Supabase,
  userId: string
): Promise<ProfileEventItem[]> {
  const { data } = await supabase
    .from("event_registrations")
    .select("rsvp_status, events(id, title, slug, start_time, end_time, event_type, community_id)")
    .eq("user_id", userId)
    .order("registered_at", { ascending: false });

  if (!data) return [];

  return data
    .filter((row) => row.events !== null)
    .map((row) => ({
      rsvp_status: row.rsvp_status,
      event: row.events as ProfileEventItem["event"],
    }));
}
