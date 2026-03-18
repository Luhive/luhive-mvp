export interface IpLocationData {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
}

interface IpApiCoResponse {
  error?: boolean;
  reason?: string;
  ip?: string;
  country_name?: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

/**
 * Extract the real client IP from request headers.
 * Supports Netlify, Cloudflare, Nginx, and generic proxy setups.
 */
function getClientIp(request: Request): string | null {
  const headers = request.headers;
  return (
    headers.get("x-nf-client-connection-ip") || // Netlify
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-real-ip") || // Nginx
    headers.get("x-forwarded-for")?.split(",")[0].trim() || // Generic proxy
    null
  );
}

function isPublicIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v) return false;

  // Obvious non-public / local
  if (
    v === "localhost" ||
    v === "::1" ||
    v.startsWith("127.") ||
    v.startsWith("10.") ||
    v.startsWith("192.168.") ||
    v.startsWith("169.254.") ||
    v.startsWith("fe80:") ||
    v.startsWith("fc") ||
    v.startsWith("fd")
  ) {
    return false;
  }

  // 172.16.0.0 – 172.31.255.255
  if (v.startsWith("172.")) {
    const parts = v.split(".");
    const second = Number(parts[1]);
    if (Number.isFinite(second) && second >= 16 && second <= 31) {
      return false;
    }
  }

  return true;
}

/**
 * Try to read geo data directly from platform headers (Netlify, Cloudflare, etc.)
 */
function getGeoFromHeaders(request: Request): Omit<IpLocationData, "ip"> | null {
  const headers = request.headers;

  // Netlify / generic / custom headers used elsewhere in the app
  const country =
    headers.get("x-country") ||
    headers.get("x-nf-country") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    null;

  const city =
    headers.get("x-city") ||
    headers.get("x-nf-city") ||
    headers.get("x-vercel-ip-city") ||
    null;

  const region =
    headers.get("x-region") ||
    headers.get("x-nf-region") ||
    headers.get("x-vercel-ip-country-region") ||
    null;

  const timezone =
    headers.get("x-timezone") ||
    headers.get("x-nf-timezone") ||
    headers.get("x-vercel-ip-timezone") ||
    null;

  if (country || city || region || timezone) {
    return { country, city, region, timezone };
  }
  return null;
}

/**
 * Lookup geo data for a specific IP using ipapi.co
 */
async function lookupIpApiCo(ip: string): Promise<IpLocationData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as IpApiCoResponse;
    if (data.error) {
      console.warn("[ip-location] ipapi.co failed", { ip, reason: data.reason });
      return null;
    }

    return {
      ip: data.ip || ip,
      country: data.country_name || null,
      city: data.city || null,
      region: data.region || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error("[ip-location] ipapi.co error:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Gets the client's public IP and geo-location from the incoming request.
 *
 * 1. Extracts the real client IP from proxy / platform headers.
 * 2. If the platform already injects geo headers (Netlify, Cloudflare), uses those.
 * 3. Otherwise falls back to ipapi.co with the client IP.
 */
export async function getIpLocation(
  request: Request,
  clientIpOverride?: string | null,
): Promise<IpLocationData> {
  const override = (clientIpOverride || "").trim();
  const ip = override && isPublicIp(override) ? override : getClientIp(request);

  function isCountryCode(v: string | null): boolean {
    if (!v) return false;
    const s = v.trim();
    return /^[A-Z]{2}$/.test(s);
  }

  // Platform-provided geo headers (Cloudflare/Vercel/Netlify/etc.)
  const headerGeo = getGeoFromHeaders(request);
  const headerResult: IpLocationData = {
    ip,
    country: headerGeo?.country || null,
    city: headerGeo?.city || null,
    region: headerGeo?.region || null,
    timezone: headerGeo?.timezone || null,
  };

  // Fill any missing fields via geo lookup by IP (some platforms only provide country code like "AZ")
  if (ip) {
    const resolved = await lookupIpApiCo(ip);

    if (resolved) {
      return {
        ip: resolved.ip || headerResult.ip,
        // Prefer full country name from provider when header only has a 2-letter code
        country:
          (isCountryCode(headerResult.country) ? null : headerResult.country) ||
          resolved.country ||
          headerResult.country,
        city: headerResult.city || resolved.city || null,
        region: headerResult.region || resolved.region || null,
        timezone: headerResult.timezone || resolved.timezone || null,
      };
    }
  }

  return headerResult;
}
