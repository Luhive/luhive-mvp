# Ops

## Rate limiting

Model it behind a small interface so it is swappable and testable:

```ts
// src/lib/ratelimit.ts
export interface RateLimiter {
  check(key: string): Promise<{ allowed: boolean }>;
}
```

Back it with Cloudflare's Workers rate-limit binding for per-key and per-community limits. Keep crude per-IP limits at the zone level (WAF rules) so they cost no code. Reach for Durable Objects only if you later need strict, globally exact counters; do not start there.

## Caching

Set `Cache-Control` on public reads with a short TTL (for example 60s) and let Cloudflare cache. Accept up to one TTL of staleness on a newly approved startup. Build the cache key from `community_id` + path (see [Security](./11-security.md)). Add cache purge on approval only if instant freshness becomes a requirement; for a pilot, short TTL is enough.

## Secrets and environments

For the pilot we run a **single environment** (no staging/production split), to keep things simple for the first ship.

- Secrets via `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. Local dev values live in `.dev.vars` (gitignored).
- One Supabase project and one service-role key.
- Two contexts only: local (`wrangler dev`, reads `.dev.vars`) and the single deployed Worker.
- If a staging/production split is ever needed, add `env` blocks in `wrangler.jsonc` and push secrets per env; not now.

## Deploy

- `wrangler deploy` (via `pnpm run deploy`). Optionally a GitHub Action that runs typecheck, tests, then deploys on merge to main.
- Custom domain `api.luhive.com` via a Workers route on the `luhive.com` zone.
- No staging safety net with one environment: test locally with `wrangler dev` before deploying, since a deploy goes straight to live.
- Rollback is a redeploy of the previous version; keep deploys small and frequent.

## Observability

- `wrangler tail` for live logs during development.
- Workers Logs / Logpush to a sink for production. Alert on 5xx and on 4xx spikes (probing or abuse).
- Audit log of admin actions (who approved or rejected what, when) written to a table.

## Migrations

- SQL files in `db/`, applied through the Supabase SQL editor or your migration tool. The API does not run migrations.
