import { createClient } from "~/shared/lib/supabase/server";
import type { HubData } from "~/modules/hub/model/hub-types";
import {
  getVisibleCommunities,
  getCommunityCounts,
  getUserProfile,
  withCounts,
  getAdminCommunityIds,
} from "~/modules/hub/data/hub-repo.server";

export async function loader({ request }: { request: Request }) {
  const { supabase } = createClient(request);

  const dataPromise = (async (): Promise<HubData> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { communities, error } = await getVisibleCommunities(supabase);

    if (error) {
      console.error("Error fetching communities:", error);
      return {
        communities: [],
        user: user ? { id: user.id } : null,
      };
    }

    if (!communities || communities.length === 0) {
      return {
        communities: [],
        user: user ? { id: user.id } : null,
      };
    }

    const communityIds = communities.map((c) => c.id);
    const { memberCounts, eventCounts } = await getCommunityCounts(
      supabase,
      communityIds
    );

    const communitiesWithCounts = withCounts(communities, memberCounts, eventCounts);

    let userProfile: HubData["user"] = null;
    let adminIds = new Set<string>();
    if (user) {
      const [profile, adminCommunityIds] = await Promise.all([
        getUserProfile(supabase, user.id),
        getAdminCommunityIds(supabase, user.id),
      ]);
      userProfile = profile;
      adminIds = new Set(adminCommunityIds);
    }

    const communitiesWithAdmin = communitiesWithCounts.map((c) => ({
      ...c,
      isAdmin: adminIds.has(c.id),
    }));

    return {
      communities: communitiesWithAdmin,
      user: userProfile,
    };
  })();

  return {
    data: dataPromise,
  };
}
