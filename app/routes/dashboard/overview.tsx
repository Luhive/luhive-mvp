export { meta } from "~/modules/dashboard/model/overview-meta";

import { useLoaderData } from "react-router";
import { SectionCards } from "~/modules/dashboard/components/section-cards";
import { DataTable } from "~/modules/dashboard/components/data-table";
import {
  getCommunityBySlugClient,
  getMembersForCommunityClient,
  getStatsForCommunityClient,
  type Member,
  type DashboardStatsData,
} from "~/modules/dashboard/data/dashboard-repo.client";

type OverviewLoaderData = {
  members: Member[];
  stats: DashboardStatsData;
};

async function clientLoader({
  params,
}: {
  params: { slug?: string };
}): Promise<OverviewLoaderData> {
  const slug = params.slug;
  if (!slug) {
    return { members: [], stats: { totalVisits: 0, uniqueVisitors: 0, joinedUsers: 0 } };
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    return { members: [], stats: { totalVisits: 0, uniqueVisitors: 0, joinedUsers: 0 } };
  }

  const [membersResult, stats] = await Promise.all([
    getMembersForCommunityClient(community.id),
    getStatsForCommunityClient(community.id),
  ]);

  return {
    members: membersResult.error ? [] : membersResult.members,
    stats,
  };
}

export { clientLoader };

export default function DashboardOverviewPage() {
  const { members, stats } = useLoaderData<OverviewLoaderData>();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={stats} />
      <div className="px-4 lg:px-6">{/* Charts will be loaded later */}</div>
      <div className="px-4 lg:px-6">
        <DataTable data={members} />
      </div>
    </div>
  );
}
