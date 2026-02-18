import { useEffect, useState } from "react";
import { createClient } from "~/shared/lib/supabase/client";

export type DashboardStats = {
  totalVisits: number;
  uniqueVisitors: number;
  joinedUsers: number;
  loading: boolean;
};

function fetchStatsForCommunity(
  communityId: string
): Promise<Omit<DashboardStats, "loading">> {
  const supabase = createClient();

  return Promise.all([
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
  ]).then(([visitsCount, visitsData, membersCount]) => {
    const totalVisits = visitsCount.count ?? 0;
    const uniqueVisitors = new Set(
      visitsData.data?.map((v) => v.session_id) ?? []
    ).size;
    const joinedUsers = membersCount.count ?? 0;
    return { totalVisits, uniqueVisitors, joinedUsers };
  });
}

/**
 * Fetches dashboard metrics for a community.
 */
export function useDashboardStats(
  communityId: string | null | undefined
): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    joinedUsers: 0,
    loading: true,
  });

  useEffect(() => {
    if (!communityId) {
      setStats((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    fetchStatsForCommunity(communityId)
      .then((data) => {
        if (!cancelled) {
          setStats({ ...data, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [communityId]);

  return stats;
}
