import { Suspense, lazy } from "react"
import { useRouteLoaderData } from "react-router"
import type { DashboardLoaderData } from "./layout"

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
  // Access parent layout loader data
  const data = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout')

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<SectionCardsSkeleton />}>
        <SectionCards />
      </Suspense>
      <div className="px-4 lg:px-6">
        {/* Charts will be loaded later */}
      </div>
      <Suspense fallback={<DataTableSkeleton />}>
        <DataTable data={[]} />
      </Suspense>
    </div>
  )
}

