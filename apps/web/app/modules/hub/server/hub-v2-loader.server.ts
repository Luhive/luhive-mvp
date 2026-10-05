import { createClient } from "~/shared/lib/supabase/server";
import type { HubV2LoaderData } from "~/modules/hub/model/hub-v2-types";
import {
  getAdminCommunityIds,
  getUserProfile,
  getVisibleCommunities,
} from "~/modules/hub/data/hub-repo.server";
import {
  listPastHubEvents,
  listUpcomingHubEvents,
} from "~/modules/hub/data/hub-events-repo.server";

export async function loader({ request }: { request: Request }): Promise<HubV2LoaderData> {
  const { supabase } = createClient(request);
  const now = new Date();

  const userIdPromise = supabase.auth
    .getUser()
    .then(({ data }) => data.user?.id ?? null);

  const viewer = userIdPromise.then((userId) =>
    userId ? getUserProfile(supabase, userId) : null,
  );

  const adminIdsPromise = userIdPromise.then((userId) =>
    userId ? getAdminCommunityIds(supabase, userId) : [],
  );

  const communities = Promise.all([
    getVisibleCommunities(supabase),
    adminIdsPromise,
  ]).then(([{ communities: rows, error }, adminIds]) => {
    if (error) {
      console.error("Error fetching hub communities:", error);
      return [];
    }
    const adminIdSet = new Set(adminIds);
    return rows.map((community) => ({
      ...community,
      isAdmin: adminIdSet.has(community.id),
    }));
  });

  const upcomingEvents = listUpcomingHubEvents(supabase, now).then(({ events, error }) => {
    if (error) console.error("Error fetching upcoming hub events:", error);
    return events;
  });

  const pastEvents = listPastHubEvents(supabase, now).then(({ events, error }) => {
    if (error) console.error("Error fetching past hub events:", error);
    return events;
  });

  return { viewer, communities, upcomingEvents, pastEvents };
}
