import { Suspense, lazy } from "react"
import { useCommunityMembers } from "~/hooks/use-community-members"
import { useDashboardCommunity } from "~/hooks/use-dashboard-community"

import { SectionCardsSkeleton } from "~/components/section-cards-skeleton"
import { DataTableSkeleton } from "~/components/data-table-skeleton"

// Lazy load heavy components
const SectionCards = lazy(() => import("~/components/section-cards").then(m => ({ default: m.SectionCards })))
const DataTable = lazy(() => import("~/components/data-table").then(m => ({ default: m.DataTable })))

export function meta() {
  return [
    { title: "Dashboard Overview - Luhive" },
    { name: "description", content: "Manage your community dashboard" },
  ];
}

export default function DashboardOverview() {
  // Access parent layout data via CSR hook
  const { data: dashboardData } = useDashboardCommunity()
  const { members, loading, error } = useCommunityMembers(dashboardData?.community?.id)

  // Layout handles the skeleton, so we just show content loading states
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<SectionCardsSkeleton />}>
        <SectionCards />
      </Suspense>
      <div className="px-4 lg:px-6">
        {/* Charts will be loaded later */}
      </div>
      {loading ? (
        <DataTableSkeleton />
      ) : error ? (
        <div className="px-4 lg:px-6">
          <p className="text-sm text-muted-foreground">Failed to load members: {error}</p>
        </div>
      ) : (
        <Suspense fallback={<DataTableSkeleton />}>
          <DataTable data={members} />
        </Suspense>
      )}
    </div>
  )
}

