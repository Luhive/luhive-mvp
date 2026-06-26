import { useMemo, useState } from "react";

import type {
  EventRegistrationStatRow,
  EventStatisticsTimeRange,
  EventStatisticsViewModel,
  EventVisitStatRow,
} from "~/modules/events/model/event-statistics.types";
import {
  buildBreakdown,
  buildChartData,
  countVisitsSince,
  getDays,
  inRange,
  startOfDay,
} from "~/modules/events/utils/event-statistics";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";

type UseEventStatisticsResult = EventStatisticsViewModel & {
  setRange: (range: EventStatisticsTimeRange) => void;
};

export function useEventStatistics(
  visits: EventVisitStatRow[],
  registrations: EventRegistrationStatRow[],
): UseEventStatisticsResult {
  const [range, setRange] = useState<EventStatisticsTimeRange>("7d");

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

  const registeredFromViews = useMemo(
    () =>
      filteredRegistrations.filter(
        (row) =>
          !!row.registration_session_id &&
          visitorSessions.has(row.registration_session_id),
      ).length,
    [filteredRegistrations, visitorSessions],
  );

  const conversionRate = filteredVisits.length
    ? (registeredFromViews / filteredVisits.length) * 100
    : 0;

  const pageViewWindows = useMemo(() => {
    const now = new Date();
    const since24h = new Date(now);
    since24h.setHours(now.getHours() - 24);
    const since7d = new Date(now);
    since7d.setDate(now.getDate() - 7);
    const since30d = new Date(now);
    since30d.setDate(now.getDate() - 30);

    return {
      pageViews24h: countVisitsSince(visits, since24h),
      pageViews7d: countVisitsSince(visits, since7d),
      pageViews30d: countVisitsSince(visits, since30d),
    };
  }, [visits]);

  const sources = useMemo(
    () =>
      buildBreakdown(
        filteredVisits.map((row) => normalizeUtmSource(row.utm_source)),
        "direct",
      ),
    [filteredVisits],
  );

  const countries = useMemo(
    () =>
      buildBreakdown(
        filteredVisits.map((row) => row.country || "unknown"),
        "unknown",
      ),
    [filteredVisits],
  );

  const cities = useMemo(
    () =>
      buildBreakdown(
        filteredVisits.map((row) => row.city || "unknown"),
        "unknown",
      ),
    [filteredVisits],
  );

  return {
    range,
    setRange,
    chartData,
    summary: {
      ...pageViewWindows,
      uniqueVisitors,
      registeredFromViews,
      conversionRate,
    },
    sources,
    countries,
    cities,
  };
}
