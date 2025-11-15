/**
 * HTTP cache headers utility
 * Provides consistent cache control headers for different use cases
 */

export interface CacheOptions {
  maxAge?: number; // Time in seconds the response is considered fresh
  staleWhileRevalidate?: number; // Time in seconds to serve stale content while revalidating
  private?: boolean; // If true, response is only cacheable by private caches (browsers)
}

/**
 * Get cache headers for public, cacheable responses
 * Best for semi-static content that can be cached by CDN
 */
export function getPublicCacheHeaders(options: CacheOptions = {}) {
  const {
    maxAge = 60,
    staleWhileRevalidate = 300,
    private: isPrivate = false,
  } = options;

  const cacheControl = isPrivate
    ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    : `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return {
    'Cache-Control': cacheControl,
  };
}

/**
 * Get cache headers for private, user-specific responses
 * Best for authenticated content that should only be cached by the browser
 */
export function getPrivateCacheHeaders(options: CacheOptions = {}) {
  const {
    maxAge = 30,
    staleWhileRevalidate = 60,
  } = options;

  return {
    'Cache-Control': `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

/**
 * Get no-cache headers for dynamic content
 * Forces revalidation on every request
 */
export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

