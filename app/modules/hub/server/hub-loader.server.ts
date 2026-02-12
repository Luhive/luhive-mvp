import { createClient } from "~/lib/supabase.server";
import type { HubData } from "~/modules/hub/model/hub-types";
import {
  getVisibleCommunities,
  getCommunityCounts,
  getUserProfile,
  withCounts,
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
    if (user) {
      userProfile = await getUserProfile(supabase, user.id);
    }

    return {
      communities: communitiesWithCounts,
      user: userProfile,
    };
  })();

  return {
    data: dataPromise,
  };
}
