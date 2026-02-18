import { Skeleton } from "~/shared/components/ui/skeleton";
import { AttendersTableSkeleton } from "~/modules/events/components/attenders-table-skeleton";

/**
 * Attenders tab skeleton: header + attenders table.
 * Matches the layout of the attenders page.
 */
export function DashboardAttendersSkeleton() {
  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <AttendersTableSkeleton />
      </div>
    </div>
  );
}
