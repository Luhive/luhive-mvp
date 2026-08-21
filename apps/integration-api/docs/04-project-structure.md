# Project structure

```
integration-api/
├─ src/
│  ├─ index.ts              # Worker entry: export default app
│  ├─ app.ts                # Hono assembly: middleware, routes, error handler
│  ├─ env.ts                # Env (bindings) type + zod validation
│  ├─ lib/
│  │  ├─ supabase.ts        # createSupabase(env) factory
│  │  ├─ api-key.ts         # generate / verify / scope  (framework-agnostic)
│  │  ├─ errors.ts          # ApiError
│  │  ├─ dto.ts             # row -> public/admin DTO mappers
│  │  ├─ ratelimit.ts       # RateLimiter interface + CF-backed impl
│  │  └─ cache.ts           # community-scoped edge cache helpers
│  ├─ middleware/
│  │  ├─ auth.ts            # external API-key auth
│  │  └─ internal-auth.ts   # dashboard JWT verify + role check
│  ├─ routes/               # thin Hono sub-apps, mounted via app.route()
│  │  ├─ events.ts          # GET /v1/events
│  │  ├─ startups.ts        # GET/POST /v1/startups, GET/PATCH /v1/startups/:id
│  │  └─ public.ts          # GET /v1/public/events (partner feed)
│  ├─ services/             # HTTP-agnostic logic; never touch `c`
│  │  ├─ events.ts          # EventsService
│  │  └─ startups.ts        # StartupsService
│  └─ schemas/
│     ├─ events.ts          # zod request + response schemas
│     └─ startups.ts
├─ db/
│  ├─ 0001_api_keys.sql
│  └─ 0002_startups.sql
├─ scripts/
│  └─ create-key.ts         # local admin script to mint a key
├─ wrangler.toml
├─ tsconfig.json
├─ package.json
├─ .dev.vars               # local secrets, gitignored
└─ .gitignore
```

Keep `lib/` framework-agnostic so it survives any future runtime change. Only `index.ts`, `app.ts`, and the middleware touch Hono/Workers specifics.
