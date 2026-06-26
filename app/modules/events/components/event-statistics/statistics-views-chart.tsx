import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import type {
  EventStatisticsChartPoint,
  EventStatisticsSummary,
  EventStatisticsTimeRange,
} from "~/modules/events/model/event-statistics.types";
import { Card, CardContent } from "~/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/shared/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/select";

const chartConfig = {
  views: {
    label: "Page Views",
    color: "var(--primary)",
  },
  registrations: {
    label: "Registrations",
    color: "color-mix(in oklab, var(--primary) 45%, white)",
  },
} satisfies ChartConfig;

const RANGE_OPTIONS: { value: EventStatisticsTimeRange; label: string }[] = [
  { value: "1d", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span
        className={`text-lg font-semibold tabular-nums ${valueClassName ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

type StatisticsViewsChartProps = {
  chartData: EventStatisticsChartPoint[];
  summary: EventStatisticsSummary;
  range: EventStatisticsTimeRange;
  onRangeChange: (range: EventStatisticsTimeRange) => void;
};

export function StatisticsViewsChart({
  chartData,
  summary,
  range,
  onRangeChange,
}: StatisticsViewsChartProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary h-2.5 w-2.5 rounded-sm" />
          <span className="text-sm font-medium">Page Views</span>
          <span className="bg-primary/45 ml-3 h-2.5 w-2.5 rounded-sm" />
          <span className="text-muted-foreground text-sm">Registrations</span>
        </div>
        <Select
          value={range}
          onValueChange={(value) =>
            onRangeChange(value as EventStatisticsTimeRange)
          }
        >
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CardContent className="px-2 pb-1">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={chartData}
            margin={{ left: 2, right: 2, top: 8, bottom: 4 }}
            barCategoryGap="22%"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="views" fill="var(--color-views)" radius={[3, 3, 0, 0]} />
            <Bar
              dataKey="registrations"
              fill="var(--color-registrations)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t px-5 py-4">
        <Stat label="30 days" value={summary.pageViews30d.toLocaleString()} />
        <Stat label="7 days" value={summary.pageViews7d.toLocaleString()} />
        <Stat label="24 hours" value={summary.pageViews24h.toLocaleString()} />
        <div className="bg-border h-8 w-px shrink-0" aria-hidden />
        <Stat label="Unique" value={summary.uniqueVisitors.toLocaleString()} />
        <Stat
          label="Registered"
          value={summary.registeredFromViews.toLocaleString()}
          valueClassName="text-green-600 dark:text-green-500"
        />
        <Stat
          label="Conversion"
          value={`${summary.conversionRate.toFixed(1)}%`}
          valueClassName="text-primary"
        />
      </div>
    </Card>
  );
}
