import { Skeleton } from "~/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

export function DashboardEditSkeleton() {
  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center gap-8 justify-between mb-6">
          <div className="w-full">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-sm border border-primary/10">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 hidden md:block" />
        </div>

        {/* Bento Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Card */}
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardContent className="p-6">
                {/* Profile Picture Skeleton */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="h-9 w-40" />
                </div>

                {/* Community Information Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stacked Cards */}
          <div className="space-y-6">
            {/* Website Card Skeleton */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-20" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </CardContent>
            </Card>

            {/* Social Media Card Skeleton */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Save Button Skeleton */}
        <div className="sticky bottom-0 bg-background border-t p-4 mt-6 md:hidden">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
