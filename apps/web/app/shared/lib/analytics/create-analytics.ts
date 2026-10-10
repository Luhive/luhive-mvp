import type {
  AnalyticsProperties,
  AnalyticsProvider,
} from "~/shared/models/analytics.types";

export function createAnalytics(providers: AnalyticsProvider[]) {
  function sendToProviders(send: (provider: AnalyticsProvider) => void) {
    if (typeof window === "undefined") return;

    for (const provider of providers) {
      try {
        send(provider);
      } catch (error) {
        // Analytics must never break the page.
        console.warn(`[analytics] ${provider.name} failed`, error);
      }
    }
  }

  return {
    track: (eventName: string, properties: AnalyticsProperties = {}) =>
      sendToProviders((provider) => provider.track(eventName, properties)),
    trackPageView: (path: string) =>
      sendToProviders((provider) => provider.trackPageView?.(path)),
  };
}
