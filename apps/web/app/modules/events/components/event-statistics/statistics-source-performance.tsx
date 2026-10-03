import { Info } from "lucide-react";

import type { EventStatisticsSourceRow } from "~/modules/events/model/event-statistics.types";
import { Card } from "~/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_repeat(3,3.25rem)] items-center gap-x-3 sm:grid-cols-[minmax(0,1fr)_repeat(3,5.5rem)] sm:gap-x-4";

// Bars scale via transform so range changes stay on the compositor and can be
// interrupted mid-transition when the organizer flips ranges quickly.
const BAR_CLASS =
  "absolute inset-0 origin-left rounded-full transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

type StatisticsSourcePerformanceProps = {
  sources: EventStatisticsSourceRow[];
};

export function StatisticsSourcePerformance({
  sources,
}: StatisticsSourcePerformanceProps) {
  const scaleMax = sources.reduce(
    (max, row) => Math.max(max, row.views, row.registrations),
    0,
  );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-4">
        <h3 className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          Source performance
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Source performance info"
                className="hover:text-foreground inline-flex transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px] normal-case">
              Create a custom tracking link by adding ?utm_source=your-link-name
              to your event URL. Registrations are credited to the source the
              visitor first arrived from.
            </TooltipContent>
          </Tooltip>
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary/25 h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">Views</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Registrations</span>
          </span>
        </div>
      </div>

      {sources.length === 0 ? (
        <p className="text-muted-foreground border-t px-5 py-6 text-sm">
          No source data yet. Share a link with ?utm_source= to start tracking.
        </p>
      ) : (
        <div className="border-t px-5 pb-2">
          <div
            className={`${ROW_GRID} text-muted-foreground py-2.5 text-[11px] font-medium tracking-wide uppercase`}
          >
            <span>Source</span>
            <span className="text-right">Views</span>
            <span className="text-right">
              <span className="sm:hidden">Reg.</span>
              <span className="hidden sm:inline">Registered</span>
            </span>
            <span className="text-right">
              <span className="sm:hidden">Conv.</span>
              <span className="hidden sm:inline">Conversion</span>
            </span>
          </div>

          <ul className="divide-y">
            {sources.map((row) => (
              <li key={row.source} className={`${ROW_GRID} py-3`}>
                <div className="min-w-0 space-y-1.5">
                  <span
                    className="block truncate text-sm font-medium capitalize"
                    title={row.source}
                  >
                    {row.source}
                  </span>
                  <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
                    <div
                      className={`${BAR_CLASS} bg-primary/25`}
                      style={{
                        transform: `scaleX(${scaleMax ? row.views / scaleMax : 0})`,
                      }}
                    />
                    <div
                      className={`${BAR_CLASS} bg-green-500`}
                      style={{
                        transform: `scaleX(${scaleMax ? row.registrations / scaleMax : 0})`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-right text-sm tabular-nums">
                  {row.views.toLocaleString()}
                </span>
                <span
                  className={`text-right text-sm font-medium tabular-nums ${
                    row.registrations > 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {row.registrations.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-right text-sm tabular-nums">
                  {row.conversionRate === null
                    ? "—"
                    : `${row.conversionRate.toFixed(1)}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
