import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import type { Community as BaseCommunity } from "~/shared/models/entity.types";
import type { Community, UserData } from "~/modules/hub/model/hub-types";

export async function getVisibleCommunities(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("is_show", true)
    .order("created_at", { ascending: false });

  return { communities: data ?? [], error };
}

export async function getCommunityCounts(
  supabase: SupabaseClient<Database>,
  communityIds: string[]
) {
  const [memberCountsResult, eventCountsResult] = await Promise.all([
    supabase
      .from("community_members")
      .select("community_id")
      .in("community_id", communityIds),
    supabase
      .from("events")
      .select("community_id")
      .in("community_id", communityIds)
      .eq("status", "published"),
  ]);

  const memberCounts = new Map<string, number>();
  (memberCountsResult.data || []).forEach((member) => {
    const count = memberCounts.get(member.community_id!) || 0;
    memberCounts.set(member.community_id!, count + 1);
  });

  const eventCounts = new Map<string, number>();
  (eventCountsResult.data || []).forEach((event) => {
    const count = eventCounts.get(event.community_id) || 0;
    eventCounts.set(event.community_id, count + 1);
  });

  return { memberCounts, eventCounts };
}

export async function getUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserData> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, avatar_url, full_name")
    .eq("id", userId)
    .single();

  return profile
    ? {
        id: profile.id,
        avatar_url: profile.avatar_url,
        full_name: profile.full_name,
      }
    : { id: userId };
}

export function withCounts(
  communities: BaseCommunity[],
  memberCounts: Map<string, number>,
  eventCounts: Map<string, number>,
): Community[] {
  return communities.map((community) => ({
    ...community,
    memberCount: memberCounts.get(community.id) || 0,
    eventCount: eventCounts.get(community.id) || 0,
  }));
}
