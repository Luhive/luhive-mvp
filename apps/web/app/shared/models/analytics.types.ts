export type AnalyticsProperties = Record<string, string | number | boolean>;

export type AnalyticsProvider = {
  name: string;
  track: (eventName: string, properties: AnalyticsProperties) => void;
  /** Omitted by providers that track page views on their own. */
  trackPageView?: (path: string) => void;
};
