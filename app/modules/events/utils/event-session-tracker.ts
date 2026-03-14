import {
  parseUTMFromSearchParams,
  type UTMAttribution,
} from "~/modules/events/utils/utm-source";

const SESSION_KEY = "event_session_id";
const ATTRIBUTION_KEY = "event_first_touch_attribution";
const VISIT_KEY_PREFIX = "event_last_visit";
const FIRST_VISIT_TS_PREFIX = "event_first_visit_ts";
const TRACKING_WINDOW = 5 * 60 * 1000;

export type EventTrackingContext = UTMAttribution & {
  sessionId: string;
  firstVisitStartedAt: string;
  referrerUrl: string | null;
  referrerDomain: string | null;
};

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getEventSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const created = generateSessionId();
  localStorage.setItem(SESSION_KEY, created);
  return created;
}

export function shouldTrackEventVisit(eventId: string): boolean {
  if (typeof window === "undefined") return false;

  const key = `${VISIT_KEY_PREFIX}_${eventId}`;
  const lastVisitRaw = localStorage.getItem(key);

  if (!lastVisitRaw) {
    localStorage.setItem(key, String(Date.now()));
    return true;
  }

  const lastVisit = Number.parseInt(lastVisitRaw, 10);
  const withinWindow = Date.now() - lastVisit < TRACKING_WINDOW;

  if (withinWindow) {
    return false;
  }

  localStorage.setItem(key, String(Date.now()));
  return true;
}

function getOrPersistAttribution(): UTMAttribution {
  if (typeof window === "undefined") {
    return {
      utmSource: "direct",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    };
  }

  const fromUrl = parseUTMFromSearchParams(new URLSearchParams(window.location.search));
  const hasExplicitSource = new URLSearchParams(window.location.search).get("utm_source");

  if (hasExplicitSource) {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  const stored = localStorage.getItem(ATTRIBUTION_KEY);
  if (!stored) {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  try {
    return JSON.parse(stored) as UTMAttribution;
  } catch {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
}

function getReferrerInfo(): { referrerUrl: string | null; referrerDomain: string | null } {
  if (typeof document === "undefined" || !document.referrer) {
    return { referrerUrl: null, referrerDomain: null };
  }

  try {
    const referrer = new URL(document.referrer);
    return {
      referrerUrl: referrer.toString(),
      referrerDomain: referrer.hostname.toLowerCase(),
    };
  } catch {
    return {
      referrerUrl: document.referrer,
      referrerDomain: null,
    };
  }
}

function getOrCreateFirstVisitStartedAt(eventId: string, sessionId: string): string {
  if (typeof window === "undefined") return new Date().toISOString();

  const key = `${FIRST_VISIT_TS_PREFIX}_${eventId}_${sessionId}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const created = new Date().toISOString();
  localStorage.setItem(key, created);
  return created;
}

export function getEventTrackingContext(eventId: string): EventTrackingContext {
  const sessionId = getEventSessionId();
  const attribution = getOrPersistAttribution();
  const firstVisitStartedAt = getOrCreateFirstVisitStartedAt(eventId, sessionId);
  const referrer = getReferrerInfo();

  return {
    sessionId,
    firstVisitStartedAt,
    ...attribution,
    ...referrer,
  };
}
