import { Skeleton } from "~/components/ui/skeleton"

export function DataTableSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {/* Section Title - Always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Joined Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage members who have joined your community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-80 bg-muted" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-8 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
            <Skeleton className="h-4 flex-1 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              <Skeleton className="h-4 w-8 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 flex-1 bg-muted" />
              <Skeleton className="h-8 w-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 bg-muted" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-8 w-20 bg-muted" />
          </div>
          <Skeleton className="h-4 w-24 bg-muted" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 bg-muted rounded" />
            <Skeleton className="h-8 w-8 bg-muted rounded" />
            <Skeleton className="h-8 w-8 bg-muted rounded" />
            <Skeleton className="h-8 w-8 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

