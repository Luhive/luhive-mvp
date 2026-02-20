import type { Community } from "~/shared/models/entity.types";
import { createClient } from "~/shared/lib/supabase/client";
import { DashboardStatsData, Member } from "../model/dashboard-types";

export async function getCommunityBySlugClient(slug: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  return { community: data as Community | null, error };
}

export async function getMembersForCommunityClient(communityId: string) {
  const supabase = createClient();

  const { data: membersData, error: membersError } = await supabase
    .from("community_members")
    .select(
      `
      id,
      role,
      joined_at,
      user_id,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("community_id", communityId)
    .order("joined_at", { ascending: false });

  if (membersError) {
    return { members: [] as Member[], error: membersError };
  }

  const members: Member[] =
    membersData?.map(
      (member: {
        id: string;
        role?: string | null;
        joined_at: string | null;
        profiles?: {
          full_name?: string | null;
          avatar_url?: string | null;
        } | null;
      }) => {
        const profile = member.profiles;
        return {
          id: member.id,
          full_name: profile?.full_name || "Unknown User",
          avatar_url: profile?.avatar_url ?? null,
          joined_at: member.joined_at ?? "",
          role: member.role || "member",
        };
      },
    ) || [];

  return { members, error: null };
}

export async function getStatsForCommunityClient(
  communityId: string,
): Promise<DashboardStatsData> {
  const supabase = createClient();

  const [visitsCount, visitsData, membersCount] = await Promise.all([
    supabase
      .from("community_visits")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
    supabase
      .from("community_visits")
      .select("session_id")
      .eq("community_id", communityId),
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
  ]);

  return {
    totalVisits: visitsCount.count ?? 0,
    uniqueVisitors: new Set(visitsData.data?.map((v) => v.session_id) ?? [])
      .size,
    joinedUsers: membersCount.count ?? 0,
  };
}
