import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { createClient } from "~/lib/supabase.client";
import { getCommunityBySlugClient } from "~/services/communities.service";
import type { Database } from "~/models/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type DashboardCommunityData = {
  community: Community;
  user: Profile;
  userEmail: string;
  role: "owner" | "admin";
};

export function useDashboardCommunity() {
  const params = useParams();
  const navigate = useNavigate();
  const slug = params.slug;

  const [data, setData] = useState<DashboardCommunityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("No community slug provided");
      setLoading(false);
      navigate("/");
      return;
    }

    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Check authentication
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !authUser) {
          navigate("/login");
          return;
        }

        // Fetch community
        const { community, error: communityError } =
          await getCommunityBySlugClient(slug);

        if (cancelled) return;

        if (communityError || !community) {
          setError(communityError?.message || "Community not found");
          navigate(`/c/${slug}`);
          return;
        }

        // Check if user is owner or admin
        const isOwner = community.created_by === authUser.id;
        let role: "owner" | "admin" | null = null;

        if (isOwner) {
          role = "owner";
        } else {
          const { data: membership } = await supabase
            .from("community_members")
            .select("role")
            .eq("community_id", community.id)
            .eq("user_id", authUser.id)
            .single();

          if (cancelled) return;

          if (membership && (membership.role === "admin" || membership.role === "owner")) {
            role = membership.role === "owner" ? "owner" : "admin";
          }
        }

        if (cancelled) return;

        // If not owner or admin, redirect
        if (!role) {
          navigate(`/c/${slug}`);
          return;
        }

        // Get user email
        const userEmail = authUser.email || "user@example.com";

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (cancelled) return;

        if (profileError || !profile) {
          // Create default profile
          const defaultProfile: Profile = {
            id: authUser.id,
            full_name: authUser.email?.split("@")[0] || "User",
            avatar_url: null,
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            settings: null,
            gamification: null,
            metadata: null,
          };

          setData({
            community,
            user: defaultProfile,
            userEmail,
            role,
          });
        } else {
          setData({
            community,
            user: profile,
            userEmail,
            role,
          });
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  return { data, loading, error };
}
