/**
 * URL-related utilities.
 *
 * Keep these helpers small and environment-agnostic so they can be reused in
 * both server and client code without pulling in browser-only dependencies.
 */

/** Cal.com booking for community onboarding (used by Create Community CTAs). */
export const LUHIVE_CREATE_COMMUNITY_BOOKING_URL = "https://cal.com/luhive";

/**
 * Safely parse a URL string.
 *
 * Returns a URL instance on success, or null if the value is falsy or invalid.
 */
export function safeParseUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

/**
 * Returns the hostname (without protocol) for a URL string, or null if invalid.
 */
export function getHostname(value: string | null | undefined): string | null {
  const url = safeParseUrl(value);
  return url?.hostname ?? null;
}
