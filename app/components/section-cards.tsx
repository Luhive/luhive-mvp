import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Eye, Users, UserCheck } from "lucide-react"

import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

export function SectionCards() {
  // Placeholder data for community statistics
  const totalVisits = 12547
  const uniqueVisitors = 8234
  const joinedUsers = 342
  
  // Calculate conversion rate
  const conversionRate = ((joinedUsers / uniqueVisitors) * 100).toFixed(1)
  
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Visits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalVisits.toLocaleString()}
          </CardTitle>
          <CardAction>
            {/* <Badge variant="outline">
              <IconTrendingUp />
              +18.2%
            </Badge> */}
          </CardAction>
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
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unique Visitors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {uniqueVisitors.toLocaleString()}
          </CardTitle>
          <CardAction>
            {/* <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge> */}
          </CardAction>
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
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Joined Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {joinedUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            {/* <Badge variant="outline">
              <IconTrendingUp />
              +8.3%
            </Badge> */}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {conversionRate}% conversion rate <UserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Converted {conversionRate}% of visitors to members
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
