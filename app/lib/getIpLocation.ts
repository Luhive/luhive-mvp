/**
 * IP and location data model
 */
export interface IpLocationData {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
}

/**
 * Gets user IP address and location from request headers
 * 
 * Uses Netlify's geo headers when available, with fallbacks for other environments
 */
export function getIpLocation(request: Request): IpLocationData {
  const headers = request.headers;

  // Get IP address with fallbacks for different environments
  const ip =
    headers.get("x-nf-client-connection-ip") || // Netlify
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-real-ip") || // Nginx
    headers.get("x-forwarded-for")?.split(",")[0].trim() || // Generic proxy
    null;

  // Get location from Netlify geo headers
  const country = headers.get("x-country") || null;
  const city = headers.get("x-city") || null;
  const region = headers.get("x-region") || null;
  const timezone = headers.get("x-timezone") || null;

  return {
    ip,
    country,
    city,
    region,
    timezone,
  };
}

