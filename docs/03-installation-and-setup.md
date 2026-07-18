# Installation and setup

Current as of the Cloudflare tooling in mid-2026. Wrangler and the Hono starter move, so if a command drifts, check the current Hono-on-Workers and Cloudflare docs rather than assume.

## 1. Scaffold

Use Cloudflare's C3 scaffolder with the Hono template. It sets up Wrangler, TypeScript, and the entry file:

```
npm create cloudflare@latest luhive-integration-api -- --template hono
```

The template already includes `hono` and `wrangler`, so those are not reinstalled below. Newer scaffolds default to `wrangler.jsonc` rather than the `wrangler.toml` shown in [Runtime, config, and bindings](./06-runtime-config-and-bindings.md); either works, just convert the keys if you prefer JSONC. Keep `compatibility_flags = ["nodejs_compat"]` (needed for `node:crypto` in `api-key.ts`) and a recent `compatibility_date`.

## 2. Runtime dependencies

Only what the plan uses:

```
npm i zod @hono/zod-validator @supabase/supabase-js
```

- `zod` — the contract layer (v4 is the current major). Source of truth for input, DTOs, and env.
- `@hono/zod-validator` — wires Zod schemas into Hono routes as validation middleware.
- `@supabase/supabase-js` — data access over PostgREST/HTTP, the edge-safe path from [Architecture](./02-architecture-and-workers-model.md).

## 3. Dev dependencies

```
npm i -D typescript vitest @cloudflare/vitest-pool-workers tsx
```

- `vitest` + `@cloudflare/vitest-pool-workers` — runs tests inside the real Workers runtime (Miniflare), so the tenant-isolation test (see [Open questions](./17-open-questions.md), Q4) exercises real behavior, not a mock. Requires Vitest 4.1 or later, so let npm resolve a matching pair.
- `tsx` — runs the local `scripts/create-key.ts`, which executes in Node (not Workers) and just needs the service-role key in its env.

Types: rather than installing `@cloudflare/workers-types` by hand, use Wrangler's type generation (`wrangler types`), which produces a `CloudflareBindings` interface from your config. Re-run it after any binding change.

## 4. What we deliberately do NOT install

Enforces the [Non-goals](./14-non-goals.md) from commit one: no ORM (Drizzle etc.), because `supabase-js` is already the data layer; no DI container; no repository library; no rate-limit package yet (WAF plus Turnstile cover the pilot). Adding any of these is a deliberate non-goals discussion, not a default.

Concrete reason beyond tidiness: Workers have a 1MB compressed bundle limit on the free tier, 10MB on paid. Every dependency eats into that, which is the same pressure behind convention rule 2 (functions over static-util classes, for tree-shaking). Keep the dependency list short.

## 5. Secrets and local env

Secrets go through Wrangler, never the repo:

```
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

For local dev, mirror the values in `.dev.vars` (gitignored). Non-secret vars like `SUPABASE_URL` live in the Wrangler config.

## 6. package.json scripts

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typegen": "wrangler types",
    "test": "vitest",
    "create-key": "tsx scripts/create-key.ts"
  }
}
```

## 7. Sanity path

After scaffolding: `npm run typegen`, drop in the foundation code (adapting `lib/supabase.ts` to build from `c.env`), `npm run dev`, then hit `/health` and `/v1/whoami` with a key minted via `npm run create-key`. Once `/v1/whoami` returns the right community and scopes, the auth foundation is proven and you move to events.
