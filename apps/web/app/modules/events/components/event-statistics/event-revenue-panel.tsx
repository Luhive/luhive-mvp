import { formatMoney } from "@luhive/domain/v1/money";
import type { EventRevenue } from "~/modules/events/model/event-revenue.types";
import { Card } from "~/shared/components/ui/card";

function RevenueStat({
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

export function EventRevenuePanel({ revenue }: { revenue: EventRevenue }) {
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <RevenueStat
          label="Revenue"
          value={formatMoney(revenue.revenueMinor, revenue.currency)}
          valueClassName="text-green-600 dark:text-green-500"
        />
        <RevenueStat label="Paid" value={String(revenue.paidCount)} />
        <RevenueStat label="Unpaid" value={String(revenue.pendingCount)} />
      </div>
    </Card>
  );
}
