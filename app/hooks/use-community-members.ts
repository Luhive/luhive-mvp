import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase.client";

type Member = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
  role: string;
};

export function useCommunityMembers(communityId: string | null | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(!!communityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchMembers() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch community members with their profile data
        const { data: membersData, error: membersError } = await supabase
          .from("community_members")
          .select(`
            id,
            role,
            joined_at,
            user_id,
            profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("community_id", communityId)
          .order("joined_at", { ascending: false });

        if (cancelled) return;

        if (membersError) {
          setError(membersError.message);
          setMembers([]);
          return;
        }

        // Transform data to match Member schema
        const transformedMembers: Member[] =
          membersData?.map((member: any) => {
            const profile = member.profiles;

            return {
              id: member.id,
              full_name: profile?.full_name || "Unknown User",
              avatar_url: profile?.avatar_url || null,
              joined_at: member.joined_at,
              role: member.role || "member",
            };
          }) || [];

        setMembers(transformedMembers);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch members");
        setMembers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [communityId]);

  return { members, loading, error };
}
