# Architecture and the Workers execution model

```
                 ┌────────────────────────┐
   Browser  ───► │  Marketing site (Next)  │  (Luhive-owned)
   (form)        │  server-side, holds sk  │
                 └───────────┬─────────────┘
                             │  Bearer sk_...
                             ▼
   Dashboard ──► ┌──────────────────────────────┐
   (admin JWT)   │   Integration API (Workers)   │ ──► Supabase (service role, HTTP)
                 │   Hono · Zod · edge runtime    │
                 └──────────────────────────────┘
```

## Two classes of caller

- **External (keyed):** the marketing sites. Authenticated by an API key, hard-scoped to one community, limited by scopes.
- **Internal (dashboard):** approvals and admin reads. Authenticated by the admin's forwarded Supabase JWT, with a role check against `community_members`.

## What Workers changes versus a Node server

Workers is serverless and edge-distributed, not a long-running process. Three consequences shape the code:

- **Config is per-request via bindings**, not `process.env`. The Supabase client is built from `c.env` inside the request, not as a module-level singleton.
- **No shared in-process memory across requests or edge locations.** Anything stateful (rate-limit counters) needs a platform-backed store, not a local variable.
- **Per-request CPU limits.** Fine for this API (a few queries per request). It is the reason heavy or long-running work does not belong here (see [Non-goals](./14-non-goals.md)).

The upside that fits a Cloudflare-first setup: caching, Turnstile, WAF, and rate limiting are platform features the Worker already sits inside, not extra infrastructure to run.

## Database access from the edge

Use `supabase-js`, which talks to Supabase over its REST layer (PostgREST) using `fetch`. That is HTTP, so it pools cleanly from Workers and needs no connection pooler. Do **not** reach for a direct Postgres driver here; that is what would force Supavisor and complicate the edge story. HTTP via `supabase-js` is the right and simplest fit.
