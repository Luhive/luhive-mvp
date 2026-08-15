export { meta } from "~/modules/dashboard/model/overview-meta";

import { useLoaderData } from "react-router";
import { SectionCards } from "~/modules/dashboard/components/section-cards";
import { DataTable } from "~/modules/dashboard/components/data-table";
import { JoinedUsersChart } from "~/modules/dashboard/components/joined-users-chart";
import {
  getCommunityBySlugClient,
  getMembersForCommunityClient,
  getStatsForCommunityClient,
  getVisitsForCommunityClient,
  type CommunityVisit,
} from "~/modules/dashboard/data/dashboard-repo.client";
import type { Member, DashboardStatsData } from "~/modules/dashboard/model/dashboard-types";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import { useMemberRoleActions } from "~/modules/dashboard/hooks/use-member-role-actions";

type OverviewLoaderData = {
  members: Member[];
  visits: CommunityVisit[];
  stats: DashboardStatsData;
};

async function clientLoader({
  params,
}: {
  params: { slug?: string };
}): Promise<OverviewLoaderData> {
  const slug = params.slug;
  if (!slug) {
    return {
      members: [],
      visits: [],
      stats: { totalVisits: 0, uniqueVisitors: 0, joinedUsers: 0 },
    };
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    return {
      members: [],
      visits: [],
      stats: { totalVisits: 0, uniqueVisitors: 0, joinedUsers: 0 },
    };
  }

  const [membersResult, visitsResult, stats] = await Promise.all([
    getMembersForCommunityClient(community.id),
    getVisitsForCommunityClient(community.id),
    getStatsForCommunityClient(community.id),
  ]);

  return {
    members: membersResult.error ? [] : membersResult.members,
    visits: visitsResult.error ? [] : visitsResult.visits,
    stats,
  };
}

export { clientLoader };

export default function DashboardOverviewPage() {
  const { members, visits, stats } = useLoaderData<OverviewLoaderData>();
  const { community, role } = useDashboardContext();
  const { promoteMember, demoteMember, updatingMemberId } = useMemberRoleActions(
    community.id,
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={stats} />
      <div className="px-4 lg:px-6">
        <JoinedUsersChart members={members} visits={visits} />
      </div>
      <div className="px-4 lg:px-6">
        <DataTable
          data={members}
          canManageRoles={role === "owner"}
          updatingMemberId={updatingMemberId}
          onPromote={promoteMember}
          onDemote={demoteMember}
        />
      </div>
    </div>
  );
}
