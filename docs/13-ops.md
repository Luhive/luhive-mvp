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

- Secrets via `wrangler secret put`, set separately per environment. Local secrets in `.dev.vars` (gitignored).
- Separate Supabase keys per environment; ideally separate Supabase projects for staging and production.
- Three environments: local (`wrangler dev`), staging, production. Promote by deploying to each.

## Deploy

- `wrangler deploy` (or `--env staging`). Optionally a GitHub Action that runs typecheck, tests, then deploys on merge to main.
- Custom domain `api.luhive.com` via a Workers route on the `luhive.com` zone.
- Rollback is a redeploy of the previous version; keep deploys small and frequent.

## Observability

- `wrangler tail` for live logs during development.
- Workers Logs / Logpush to a sink for production. Alert on 5xx and on 4xx spikes (probing or abuse).
- Audit log of admin actions (who approved or rejected what, when) written to a table.

## Migrations

- SQL files in `db/`, applied through the Supabase SQL editor or your migration tool. The API does not run migrations.
