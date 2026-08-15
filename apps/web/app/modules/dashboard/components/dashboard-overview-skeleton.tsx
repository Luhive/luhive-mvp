import { SectionCardsSkeleton } from "./section-cards-skeleton";
import { DataTableSkeleton } from "./data-table-skeleton";

/**
 * Overview tab skeleton: cards + members table.
 * Matches the layout of the dashboard overview page.
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCardsSkeleton />
      <div className="px-4 lg:px-6" />
      <DataTableSkeleton />
    </div>
  );
}
