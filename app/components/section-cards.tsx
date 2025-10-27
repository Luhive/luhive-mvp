import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Eye, Users, UserCheck } from "lucide-react"
import { useRouteLoaderData } from "react-router"
import { useEffect, useState } from "react"

import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { createClient } from "~/lib/supabase.client"
import { DashboardLoaderData } from "~/routes/dashboard/layout"

export function SectionCards() {
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout')

  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    joinedUsers: 0,
    loading: true
  })

  useEffect(() => {
    if (!parentData?.community) {
      setStats(prev => ({ ...prev, loading: false }))
      return
    }

    const fetchStats = async () => {
      const supabase = createClient()

      const { count: totalVisits } = await supabase
        .from('community_visits')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', parentData.community.id)

      const { data: visits } = await supabase
        .from('community_visits')
        .select('session_id')
        .eq('community_id', parentData.community.id)

      const uniqueVisitors = new Set(visits?.map(v => v.session_id) || []).size

      const { count: joinedUsers } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', parentData.community.id)

      setStats({
        totalVisits: totalVisits || 0,
        uniqueVisitors,
        joinedUsers: joinedUsers || 0,
        loading: false
      })
    }

    fetchStats()
  }, [parentData?.community?.id])

  const { totalVisits, uniqueVisitors, joinedUsers, loading } = stats

  // Calculate conversion rate (handle division by zero)
  const conversionRate = uniqueVisitors > 0
    ? ((joinedUsers / uniqueVisitors) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Visits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <Skeleton className="h-9 w-24 bg-muted" />
            ) : (
              totalVisits.toLocaleString()
            )}
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
            {loading ? (
              <Skeleton className="h-9 w-24 bg-muted" />
            ) : (
              uniqueVisitors.toLocaleString()
            )}
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
            {loading ? (
              <Skeleton className="h-9 w-24 bg-muted" />
            ) : (
              joinedUsers.toLocaleString()
            )}
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
            {loading ? (
              <>
                <Skeleton className="h-4 w-12 bg-muted inline-block" /> conversion rate
              </>
            ) : (
              `${conversionRate}% conversion rate`
            )}{" "}
            <UserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {loading ? (
              "Converting visitors to members"
            ) : (
              `Converted ${conversionRate}% of visitors to members`
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
