import type { Context } from 'hono';

const TTL_SECONDS = 300;

// Shared edge cache for public reads. The cache key is the normalized request
// URL only (the partner key lives in the Authorization header, not the URL), so
// one cached copy serves every partner. Verify the key BEFORE calling this.
export async function cachedJson<T>(
  c: Context,
  compute: () => Promise<T>,
): Promise<Response> {
  const cache = caches.default;

  const url = new URL(c.req.url);
  url.searchParams.sort();
  const key = new Request(url.toString(), { method: 'GET' });

  const hit = await cache.match(key);
  if (hit) return hit;

  const body = await compute();
  const res = Response.json(body);
  res.headers.set('Cache-Control', `public, max-age=${TTL_SECONDS}`);

  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
}
