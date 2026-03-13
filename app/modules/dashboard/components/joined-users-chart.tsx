import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/shared/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "~/shared/components/ui/toggle-group";
import type { Member } from "~/modules/dashboard/model/dashboard-types";

type TimeRange = "90d" | "30d" | "7d";

type ChartPoint = {
  key: string;
  label: string;
  joined: number;
};

const chartConfig = {
  joined: {
    label: "Joined users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function buildPoints(members: Member[], range: TimeRange): ChartPoint[] {
  const now = new Date();
  const joinedDates = members
    .map((member) => new Date(member.joined_at))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (range === "90d") {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const currentMonthStart = startOfMonth(now);

    const buckets = [2, 1, 0].map((offset) => {
      const date = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - offset, 1);
      return {
        key: toMonthKey(date),
        label: monthFormatter.format(date),
        joined: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    joinedDates.forEach((date) => {
      const key = toMonthKey(date);
      const target = bucketMap.get(key);
      if (target) {
        target.joined += 1;
      }
    });

    return buckets;
  }

  const totalDays = range === "30d" ? 30 : 7;
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

  return buckets;
}

export function JoinedUsersChart({ members }: { members: Member[] }) {
  const [range, setRange] = useState<TimeRange>("90d");

  const chartData = useMemo(() => buildPoints(members, range), [members, range]);
  const totalJoined = useMemo(
    () => chartData.reduce((sum, point) => sum + point.joined, 0),
    [chartData],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Joined Users</CardTitle>
          <CardDescription>Track new members in the selected time window</CardDescription>
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
        >
          <ToggleGroupItem value="90d" aria-label="Last 3 months">
            Last 3 months
          </ToggleGroupItem>
          <ToggleGroupItem value="30d" aria-label="Last 30 days">
            Last 30 days
          </ToggleGroupItem>
          <ToggleGroupItem value="7d" aria-label="Last 7 days">
            Last 7 days
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-semibold tabular-nums">{totalJoined.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Joined users in selected range</p>
        </div>

        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 12, bottom: 8 }}>
            <defs>
              <linearGradient id="fillJoined" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-joined)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-joined)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="joined"
              stroke="var(--color-joined)"
              fill="url(#fillJoined)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}