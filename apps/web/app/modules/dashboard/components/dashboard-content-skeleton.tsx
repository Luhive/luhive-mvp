import { Skeleton } from "~/shared/components/ui/skeleton"

/**
 * Content-only skeleton shown in the dashboard main area during tab navigation.
 * Renders inside the layout's content area (below header, above footer).
 */
export function DashboardContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 px-4 md:px-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}
