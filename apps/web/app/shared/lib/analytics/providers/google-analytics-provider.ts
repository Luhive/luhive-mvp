import ReactGA from "react-ga4";
import type { AnalyticsProvider } from "~/shared/models/analytics.types";

export function createGoogleAnalyticsProvider(
  measurementId: string,
): AnalyticsProvider {
  let isInitialized = false;

  function ensureInitialized(): boolean {
    if (!import.meta.env.PROD) return false;
    if (!isInitialized) {
      ReactGA.initialize(measurementId, {
        gaOptions: { send_page_view: false },
      });
      isInitialized = true;
    }
    return true;
  }

  return {
    name: "google-analytics",
    track: (eventName, properties) => {
      if (ensureInitialized()) ReactGA.event(eventName, properties);
    },
    trackPageView: (path) => {
      if (ensureInitialized()) {
        ReactGA.send({ hitType: "pageview", page: path });
      }
    },
  };
}
