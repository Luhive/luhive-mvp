import type { AnalyticsProvider } from "~/shared/models/analytics.types";

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

// Page views are tracked by the Umami script loaded in root.tsx.
export function createUmamiProvider(): AnalyticsProvider {
  return {
    name: "umami",
    track: (eventName, properties) => window.umami?.track(eventName, properties),
  };
}
