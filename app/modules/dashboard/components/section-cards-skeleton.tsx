import { Skeleton } from "~/shared/components/ui/skeleton"
import { 
  Card, 
  CardHeader, 
  CardDescription, 
  CardTitle, 
  CardAction,
  CardFooter 
} from "~/shared/components/ui/card"
import { Eye, Users, UserCheck } from "lucide-react"

export function SectionCardsSkeleton() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Total Visits Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Visits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-24 bg-muted" />
          </CardTitle>
          <CardAction />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing steadily this month <Eye className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total page views so far
          </div>
        </CardFooter>
      </Card>

      {/* Unique Visitors Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unique Visitors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-24 bg-muted" />
          </CardTitle>
          <CardAction />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            New faces discovering you <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Unique people who visited your community
          </div>
        </CardFooter>
      </Card>

      {/* Joined Users Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Joined Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-24 bg-muted" />
          </CardTitle>
          <CardAction />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Skeleton className="h-4 w-16 bg-muted inline-block" /> conversion rate <UserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Converting visitors to members
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

