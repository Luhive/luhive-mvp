# Runtime, config, and bindings

Non-secret config goes in `wrangler.jsonc`; secrets are set with `wrangler secret put` and never committed. Local development reads `.dev.vars`.

For the pilot we run a **single environment** — no `env.staging` / `env.production` blocks. Local dev (`wrangler dev`, reading `.dev.vars`) and the one deployed Worker are the only two contexts.

```jsonc
// wrangler.jsonc
{
  "name": "luhive-integration-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-18",
  "compatibility_flags": ["nodejs_compat"],   // needed for node:crypto in api-key.ts

  "vars": {
    "SUPABASE_URL": "https://xxxx.supabase.co",
    "ENVIRONMENT": "production"
  },

  // Custom domain for the deployed Worker:
  // "routes": [{ "pattern": "api.luhive.com/*", "zone_name": "luhive.com" }]

  // Secrets (set via: wrangler secret put NAME):
  //   SUPABASE_SERVICE_ROLE_KEY
  //   SUPABASE_JWT_SECRET            // for verifying forwarded admin JWTs (optional path)
}
```

Type the bindings and validate them once at startup:

```ts
// src/env.ts
import { z } from 'zod';

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ENVIRONMENT: 'development' | 'production';   // local dev vs. the one deployed Worker
  RATE_LIMITER?: RateLimit;   // Cloudflare rate-limit binding, if used
};

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENVIRONMENT: z.enum(['development', 'production']),
});

export function assertEnv(env: Env) {
  schema.parse(env);   // fail fast on a misconfigured deploy
}
```

`node:crypto` (used for key hashing) works on Workers with the `nodejs_compat` flag, so the `api-key.ts` from the foundation step carries over unchanged except for how it receives the Supabase client.

```ts
// src/lib/supabase.ts  — per-request factory, not a singleton
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export function createSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```
