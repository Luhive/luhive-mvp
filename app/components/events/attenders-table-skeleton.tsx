import { Skeleton } from "~/components/ui/skeleton";

export function AttendersTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Skeleton className="h-7 w-32 mb-2 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-48 bg-muted-foreground/20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 bg-muted-foreground/20" />
            <Skeleton className="h-6 w-16 bg-muted-foreground/20" />
            <Skeleton className="h-6 w-20 bg-muted-foreground/20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-80 bg-muted-foreground/20 " />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-8 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-20 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-28 bg-muted-foreground/20" />
            <Skeleton className="h-4 w-16 bg-muted-foreground/20 ml-auto" />
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              <Skeleton className="h-4 w-8 bg-muted" />
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32 bg-muted" />
                  <Skeleton className="h-3 w-16 bg-muted" />
                </div>
              </div>
              <Skeleton className="h-4 w-40 bg-muted" />
              <Skeleton className="h-5 w-16 bg-muted rounded-full" />
              <Skeleton className="h-5 w-16 bg-muted rounded-full" />
              <Skeleton className="h-4 w-32 bg-muted" />
              <Skeleton className="h-8 w-8 bg-muted rounded ml-auto" />
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
  );
}

