import { Info, MapPin } from "lucide-react";

import type { EventStatisticsBreakdownRow } from "~/modules/events/model/event-statistics.types";
import { Card, CardContent } from "~/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";

type BreakdownListProps = {
  title: string;
  rows: EventStatisticsBreakdownRow[];
  emptyLabel: string;
  withIcon?: boolean;
  tooltip?: string;
};

function BreakdownList({
  title,
  rows,
  emptyLabel,
  withIcon,
  tooltip,
}: BreakdownListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        {title}
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${title} info`}
                className="hover:text-foreground inline-flex transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] normal-case">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </h3>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={`${row.label}-${row.count}`} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium capitalize">
                  {withIcon ? (
                    <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                  ) : null}
                  {row.label}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {row.percent.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary/70 h-full rounded-full"
                  style={{ width: `${Math.max(row.percent, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type StatisticsBreakdownsProps = {
  sources: EventStatisticsBreakdownRow[];
  countries: EventStatisticsBreakdownRow[];
  cities: EventStatisticsBreakdownRow[];
};

export function StatisticsBreakdowns({
  sources,
  countries,
  cities,
}: StatisticsBreakdownsProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-x-10 gap-y-6 py-5 md:grid-cols-3">
        <BreakdownList
          title="Top Sources"
          rows={sources}
          emptyLabel="No source data yet."
          tooltip="Create a custom tracking link by adding ?utm_source=your-link-name to your URL."
        />
        <BreakdownList
          title="Top Countries"
          rows={countries}
          emptyLabel="No country data yet."
        />
        <BreakdownList
          title="Top Cities"
          rows={cities}
          emptyLabel="No city data yet."
          withIcon
        />
      </CardContent>
    </Card>
  );
}
