import { useMemo, useState } from "react";
import { useLoaderData, Link } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ArrowLeft, Clock3, Eye, Globe, MapPin, UserRoundCheck } from "lucide-react";

import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import {
  getEventStatisticsPayloadClient,
  type EventRegistrationStatRow,
  type EventVisitStatRow,
} from "~/modules/events/data/event-statistics-repo.client";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/shared/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "~/shared/components/ui/toggle-group";

type TimeRange = "1d" | "3d" | "7d" | "30d";

type EventStatisticsLoaderData = {
  slug: string;
  event: {
    id: string;
    title: string;
    start_time: string;
  };
  visits: EventVisitStatRow[];
  registrations: EventRegistrationStatRow[];
};

type ChartPoint = {
  key: string;
  label: string;
  views: number;
  registrations: number;
};

type BreakdownRow = {
  label: string;
  count: number;
};

const chartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(var(--chart-1))",
  },
  registrations: {
    label: "Registrations",
    color: "hsl(var(--chart-2))",
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

function getDays(range: TimeRange): number {
  if (range === "1d") return 1;
  if (range === "3d") return 3;
  if (range === "7d") return 7;
  return 30;
}

function inRange(isoDate: string | null | undefined, startDate: Date): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= startDate.getTime();
}

function buildChartData(
  range: TimeRange,
  visits: EventVisitStatRow[],
  registrations: EventRegistrationStatRow[],
): ChartPoint[] {
  const days = getDays(range);
  const today = startOfDay(new Date());

  const buckets = Array.from({ length: days }, (_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - idx - 1));
    return {
      key: toDayKey(date),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: 0,
      registrations: 0,
    };
  });

  const map = new Map(buckets.map((b) => [b.key, b]));

  visits.forEach((row) => {
    const date = new Date(row.visited_at);
    if (Number.isNaN(date.getTime())) return;
    const key = toDayKey(startOfDay(date));
    const bucket = map.get(key);
    if (bucket) bucket.views += 1;
  });

  registrations.forEach((row) => {
    const date = new Date(row.registered_at || "");
    if (Number.isNaN(date.getTime())) return;
    const key = toDayKey(startOfDay(date));
    const bucket = map.get(key);
    if (bucket) bucket.registrations += 1;
  });

  return buckets;
}

function buildBreakdown(rows: string[], fallbackLabel: string): BreakdownRow[] {
  const counts = rows.reduce<Record<string, number>>((acc, label) => {
    const value = label.trim().length > 0 ? label : fallbackLabel;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

async function clientLoader({
  params,
}: {
  params: { slug?: string; eventId?: string };
}): Promise<EventStatisticsLoaderData> {
  const slug = params.slug;
  const eventId = params.eventId;

  if (!slug || !eventId) {
    throw new Error("Missing slug or event ID");
  }

  const { community, error: communityError } = await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    throw new Error("Community not found");
  }

  const { payload, error } = await getEventStatisticsPayloadClient(eventId, community.id);

  if (error || !payload) {
    throw new Error("Event statistics not available");
  }

  return {
    slug,
    event: payload.event,
    visits: payload.visits,
    registrations: payload.registrations,
  };
}

export { clientLoader };

export default function EventStatisticsPage() {
  const { slug, event, visits, registrations } = useLoaderData<EventStatisticsLoaderData>();
  const [range, setRange] = useState<TimeRange>("7d");

  const rangeStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (getDays(range) - 1));
    return startOfDay(d);
  }, [range]);

  const filteredVisits = useMemo(
    () => visits.filter((row) => inRange(row.visited_at, rangeStart)),
    [rangeStart, visits],
  );

  const filteredRegistrations = useMemo(
    () => registrations.filter((row) => inRange(row.registered_at, rangeStart)),
    [rangeStart, registrations],
  );

  const chartData = useMemo(
    () => buildChartData(range, filteredVisits, filteredRegistrations),
    [filteredRegistrations, filteredVisits, range],
  );

  const uniqueVisitors = useMemo(
    () => new Set(filteredVisits.map((v) => v.session_id)).size,
    [filteredVisits],
  );

  const visitorSessions = useMemo(
    () => new Set(filteredVisits.map((v) => v.session_id)),
    [filteredVisits],
  );

  const registrationsFromViews = useMemo(
    () =>
      filteredRegistrations.filter(
        (row) =>
          !!row.registration_session_id &&
          visitorSessions.has(row.registration_session_id),
      ).length,
    [filteredRegistrations, visitorSessions],
  );

  const avgTimeToRegisterSeconds = useMemo(() => {
    const values = filteredRegistrations
      .map((r) => r.time_to_register_seconds)
      .filter((v): v is number => typeof v === "number" && v >= 0);

    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [filteredRegistrations]);

  const conversionRate = filteredVisits.length
    ? (registrationsFromViews / filteredVisits.length) * 100
    : 0;

  const sourceBreakdown = useMemo(
    () =>
      buildBreakdown(
        filteredVisits.map((row) => normalizeUtmSource(row.utm_source)),
        "direct",
      ),
    [filteredVisits],
  );

  const countryBreakdown = useMemo(
    () => buildBreakdown(filteredVisits.map((row) => row.country || "unknown"), "unknown"),
    [filteredVisits],
  );

  const cityBreakdown = useMemo(
    () => buildBreakdown(filteredVisits.map((row) => row.city || "unknown"), "unknown"),
    [filteredVisits],
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Event Statistics</h1>
            <p className="text-muted-foreground text-sm">{event.title}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/dashboard/${slug}/events`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to events
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Event Page Views</CardTitle>
              <CardDescription>Range-based view and registration trend</CardDescription>
            </div>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(value) => value && setRange(value as TimeRange)}
              variant="outline"
              size="sm"
              className="rounded-md border border-border/60 bg-muted/30 p-1"
            >
              <ToggleGroupItem value="1d" className="text-xs">1 day</ToggleGroupItem>
              <ToggleGroupItem value="3d" className="text-xs">3 days</ToggleGroupItem>
              <ToggleGroupItem value="7d" className="text-xs">7 days</ToggleGroupItem>
              <ToggleGroupItem value="30d" className="text-xs">1 month</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="fillViewsStat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillRegistrationsStat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-registrations)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-registrations)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={24}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  fill="url(#fillViewsStat)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="var(--color-registrations)"
                  fill="url(#fillRegistrationsStat)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Page Views</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{filteredVisits.length.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Views in selected range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered From Views</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{registrationsFromViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <UserRoundCheck className="h-4 w-4" />
              Conversion: {conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Visitors</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{uniqueVisitors.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              Distinct sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Time To Register</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{avgTimeToRegisterSeconds}s</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock3 className="h-4 w-4" />
              From first page view to registration
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Sources (utm_source)</CardTitle>
            <CardDescription>Where users entered from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sourceBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No source data yet.</p>
            ) : (
              sourceBreakdown.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Visitor origin countries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {countryBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No country data yet.</p>
            ) : (
              countryBreakdown.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
            <CardDescription>Visitor origin cities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {cityBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No city data yet.</p>
            ) : (
              cityBreakdown.map((row) => (
                <div key={`${row.label}-${row.count}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {row.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
