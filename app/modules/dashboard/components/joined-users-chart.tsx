import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader } from "~/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/shared/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "~/shared/components/ui/toggle-group";
import type { Member } from "~/modules/dashboard/model/dashboard-types";
import type { CommunityVisit } from "~/modules/dashboard/data/dashboard-repo.client";

type TimeRange = "90d" | "30d" | "7d";

type ChartPoint = {
  key: string;
  label: string;
  views: number;
  joined: number;
};

const chartConfig = {
  views: {
    label: "Community views",
    color: "#f97316",
  },
  joined: {
    label: "Joined users",
    color: "#fb923c",
  },
} satisfies ChartConfig;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPoints(
  members: Member[],
  visits: CommunityVisit[],
  range: TimeRange,
): ChartPoint[] {
  const now = new Date();
  const joinedDates = members
    .map((member) => new Date(member.joined_at))
    .filter((date) => !Number.isNaN(date.getTime()));
  const visitDates = visits
    .map((visit) => new Date(visit.visited_at))
    .filter((date) => !Number.isNaN(date.getTime()));

  const totalDays = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const todayStart = startOfDay(now);
  const buckets = Array.from({ length: totalDays }, (_, index) => {
    const offset = totalDays - 1 - index;
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - offset);

    return {
      key: toDayKey(date),
      label: dayFormatter.format(date),
      views: 0,
      joined: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  joinedDates.forEach((date) => {
    const key = toDayKey(startOfDay(date));
    const target = bucketMap.get(key);
    if (target) {
      target.joined += 1;
    }
  });

  visitDates.forEach((date) => {
    const key = toDayKey(startOfDay(date));
    const target = bucketMap.get(key);
    if (target) {
      target.views += 1;
    }
  });

  return buckets;
}

export function JoinedUsersChart({
  members,
  visits,
}: {
  members: Member[];
  visits: CommunityVisit[];
}) {
  const [range, setRange] = useState<TimeRange>("90d");

  const chartData = useMemo(
    () => buildPoints(members, visits, range),
    [members, visits, range],
  );
  const totalViews = useMemo(
    () => chartData.reduce((sum, point) => sum + point.views, 0),
    [chartData],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-3xl font-semibold tabular-nums">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-sm">
            Total for the selected range
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(value) => {
            if (value) {
              setRange(value as TimeRange);
            }
          }}
          variant="outline"
          size="sm"
          className="rounded-md border border-border/60 bg-muted/30 p-1"
        >
          <ToggleGroupItem
            value="90d"
            aria-label="Last 3 months"
            className="text-xs"
          >
            Last 3 months
          </ToggleGroupItem>
          <ToggleGroupItem
            value="30d"
            aria-label="Last 30 days"
            className="text-xs"
          >
            Last 30 days
          </ToggleGroupItem>
          <ToggleGroupItem
            value="7d"
            aria-label="Last 7 days"
            className="text-xs"
          >
            Last 7 days
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-5">
        <ChartContainer config={chartConfig} className="h-[240px] w-full ">
          <AreaChart
            data={chartData}
            margin={{ left: 2, right: 2, top: 8, bottom: 4 }}
          >
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.72}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillJoined" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-joined)"
                  stopOpacity={0.48}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-joined)"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ececec" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={18}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              fill="url(#fillViews)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="joined"
              stroke="var(--color-joined)"
              fill="url(#fillJoined)"
              strokeWidth={1.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}