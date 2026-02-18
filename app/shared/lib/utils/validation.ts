/**
 * Generic validation helpers.
 *
 * These functions are intentionally small and dependency-free so they can be
 * reused in both client and server environments.
 */

/**
 * Basic URL validation.
 *
 * Uses the built-in URL constructor to validate. Returns false for empty
 * values and values that are not valid absolute URLs.
 */
export function isValidUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience helper specifically for external registration/event URLs.
 *
 * Currently just delegates to `isValidUrl` but is kept separate so that
 * additional domain-specific rules can be added without touching callers.
 */
export function isValidExternalUrl(value: string | null | undefined): boolean {
  return isValidUrl(value);
}
