export interface IpLocationData {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
}

interface IpApiResponse {
  status?: "success" | "fail";
  message?: string;
  query?: string;
  country?: string;
  city?: string;
  regionName?: string;
  timezone?: string;
}

interface IpWhoResponse {
  success?: boolean;
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: { id?: string };
  message?: string;
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
 * Lookup geo data for a specific IP using ip-api.com
 */
async function lookupIpApi(ip: string): Promise<IpLocationData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as IpApiResponse;
    if (data.status !== "success") {
      console.warn("[ip-location] ip-api failed", { ip, status: data.status, message: data.message });
      return null;
    }

    return {
      ip: data.query || ip,
      country: data.country || null,
      city: data.city || null,
      region: data.regionName || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error("Error looking up IP location:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupIpWho(ip: string): Promise<IpLocationData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`https://ipwho.is/${ip}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as IpWhoResponse;
    if (data.success === false) {
      console.warn("[ip-location] ipwho.is failed", { ip, message: data.message });
      return null;
    }

    return {
      ip: data.ip || ip,
      country: data.country || null,
      city: data.city || null,
      region: data.region || null,
      timezone: data.timezone?.id || null,
    };
  } catch (error) {
    console.error("[ip-location] ipwho.is error:", error);
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
 * 3. Otherwise falls back to ip-api.com with the client IP.
 */
export async function getIpLocation(
  request: Request,
  clientIpOverride?: string | null,
): Promise<IpLocationData> {
  const override = (clientIpOverride || "").trim();
  const ip = override && isPublicIp(override) ? override : getClientIp(request);

  // Fast path: platform already provides geo data via headers
  const headerGeo = getGeoFromHeaders(request);
  if (headerGeo && (headerGeo.country || headerGeo.city)) {
    return { ip, ...headerGeo };
  }

  // Fallback: lookup geo by client IP via ip-api.com
  if (ip) {
    const apiResult = await lookupIpApi(ip);
    if (apiResult) {
      return apiResult;
    }

    const ipWhoResult = await lookupIpWho(ip);
    if (ipWhoResult) {
      return ipWhoResult;
    }
  }

  return {
    ip,
    country: null,
    city: null,
    region: null,
    timezone: null,
  };
}
