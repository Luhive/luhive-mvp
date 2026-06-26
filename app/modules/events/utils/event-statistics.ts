import type {
  EventRegistrationStatRow,
  EventStatisticsBreakdownRow,
  EventStatisticsChartPoint,
  EventStatisticsTimeRange,
  EventVisitStatRow,
} from "~/modules/events/model/event-statistics.types";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDays(range: EventStatisticsTimeRange): number {
  if (range === "1d") return 1;
  if (range === "3d") return 3;
  if (range === "7d") return 7;
  return 30;
}

export function inRange(
  isoDate: string | null | undefined,
  startDate: Date,
): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= startDate.getTime();
}

export function countVisitsSince(
  visits: EventVisitStatRow[],
  sinceDate: Date,
): number {
  return visits.filter((row) => inRange(row.visited_at, sinceDate)).length;
}

function toHourKey(date: Date): string {
  return `${toDayKey(date)}-${date.getHours().toString().padStart(2, "0")}`;
}

function buildHourlyChartData(
  visits: EventVisitStatRow[],
  registrations: EventRegistrationStatRow[],
): EventStatisticsChartPoint[] {
  const now = new Date();
  const buckets: EventStatisticsChartPoint[] = Array.from(
    { length: 24 },
    (_, idx) => {
      const hour = new Date(now);
      hour.setMinutes(0, 0, 0);
      hour.setHours(now.getHours() - (23 - idx));
      return {
        key: toHourKey(hour),
        label: hour.toLocaleTimeString("en-US", { hour: "numeric" }),
        views: 0,
        registrations: 0,
      };
    },
  );

  const map = new Map(buckets.map((b) => [b.key, b]));

  visits.forEach((row) => {
    const date = new Date(row.visited_at);
    if (Number.isNaN(date.getTime())) return;
    const bucket = map.get(toHourKey(date));
    if (bucket) bucket.views += 1;
  });

  registrations.forEach((row) => {
    const date = new Date(row.registered_at || "");
    if (Number.isNaN(date.getTime())) return;
    const bucket = map.get(toHourKey(date));
    if (bucket) bucket.registrations += 1;
  });

  return buckets;
}

export function buildChartData(
  range: EventStatisticsTimeRange,
  visits: EventVisitStatRow[],
  registrations: EventRegistrationStatRow[],
): EventStatisticsChartPoint[] {
  if (range === "1d") {
    return buildHourlyChartData(visits, registrations);
  }

  const days = getDays(range);
  const today = startOfDay(new Date());

  const buckets: EventStatisticsChartPoint[] = Array.from(
    { length: days },
    (_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - idx - 1));
      return {
        key: toDayKey(date),
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        views: 0,
        registrations: 0,
      };
    },
  );

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

export function buildBreakdown(
  rows: string[],
  fallbackLabel: string,
): EventStatisticsBreakdownRow[] {
  const counts = rows.reduce<Record<string, number>>((acc, label) => {
    const value = label.trim().length > 0 ? label : fallbackLabel;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  const total = rows.length;

  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
