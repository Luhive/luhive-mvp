import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"
import { Skeleton } from "~/components/ui/skeleton"
import Footer from "~/components/common/footer"

export function DashboardLayoutSkeleton() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* Sidebar Skeleton */}
      <div className="flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-background">
        <div className="flex h-[var(--header-height)] items-center border-b px-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 space-y-2 p-4">
          {/* Navigation items skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-md p-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      <SidebarInset>
        {/* Header Skeleton */}
        <div className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b px-4 lg:px-6">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-48" />
        </div>
        
        {/* Content Area Skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="py-4 px-4 md:px-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
