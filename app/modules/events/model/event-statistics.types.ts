export type EventVisitStatRow = {
  visited_at: string;
  session_id: string;
  utm_source: string | null;
  country: string | null;
  city: string | null;
};

export type EventRegistrationStatRow = {
  registered_at: string | null;
  registration_session_id: string | null;
  utm_source: string | null;
  time_to_register_seconds: number | null;
};

export type EventStatisticsEvent = {
  id: string;
  title: string;
  start_time: string;
  cover_url: string | null;
};

export type EventStatisticsPayload = {
  event: EventStatisticsEvent;
  visits: EventVisitStatRow[];
  registrations: EventRegistrationStatRow[];
};

export type EventStatisticsTimeRange = "1d" | "3d" | "7d" | "30d";

export type EventStatisticsChartPoint = {
  key: string;
  label: string;
  views: number;
  registrations: number;
};

export type EventStatisticsBreakdownRow = {
  label: string;
  count: number;
  percent: number;
};

export type EventStatisticsSummary = {
  pageViews24h: number;
  pageViews7d: number;
  pageViews30d: number;
  uniqueVisitors: number;
  registeredFromViews: number;
  conversionRate: number;
};

export type EventStatisticsViewModel = {
  range: EventStatisticsTimeRange;
  chartData: EventStatisticsChartPoint[];
  summary: EventStatisticsSummary;
  sources: EventStatisticsBreakdownRow[];
  countries: EventStatisticsBreakdownRow[];
  cities: EventStatisticsBreakdownRow[];
};
