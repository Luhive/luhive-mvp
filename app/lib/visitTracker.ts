import type { UserAgentData } from "./userAgent";
import type { IpLocationData } from "./getIpLocation";

/**
 * Analytics metadata structure for community visits
 */
export interface VisitAnalytics {
  browser: string | undefined;
  browserVersion: string | undefined;
  os: string | undefined;
  deviceType: string | undefined;
  isMobile: boolean | undefined;
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isFirstVisit: boolean;
}

/**
 * Prepare analytics metadata from user agent and location data
 */
export function prepareVisitAnalytics(
  userAgent: UserAgentData,
  location: IpLocationData,
  isFirstVisit: boolean
): VisitAnalytics {
  return {
    browser: userAgent.browser.name,
    browserVersion: userAgent.browser.version,
    os: userAgent.os.name,
    deviceType: userAgent.device.type,
    isMobile: userAgent.device.isMobile,
    ip: location.ip,
    country: location.country,
    city: location.city,
    region: location.region,
    timezone: location.timezone,
    isFirstVisit,
  };
}

