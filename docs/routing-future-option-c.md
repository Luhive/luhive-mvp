# Routing: future Option C (single registry)

This note is for later. We are **not** doing this now.

## What we have today

Two related files, kept in sync manually:

| File | Role |
|------|------|
| [`app/routes.ts`](../app/routes.ts) | Declares the React Router **route tree** (patterns like `c/:slug`, nested children, which file handles each page). |
| [`app/shared/lib/routing/routes.ts`](../app/shared/lib/routing/routes.ts) | `Routes` class — builds **concrete URLs** for links, redirects, emails, and API calls (`Routes.community.event(slug, id)` → `/c/foo/events/42`). |

Call sites use `Routes.*` instead of hardcoded `/c/${slug}` strings. That was the main win.

`app/routes.ts` stays separate because it speaks a different language:

- **No leading slash** — `c/:slug`, not `/c/:slug`
- **Placeholders** — `:slug`, not a real slug value
- **Nested relative segments** — under `c/:slug`, children are `events`, `announcements/new`, not full paths

So changing `COMMUNITY_BASE` in the `Routes` class updates every link, but you still edit `app/routes.ts` by hand if the URL shape itself changes (e.g. dropping the `/c` prefix).

## Other options (for context)

**Option A — share one constant**  
Export `COMMUNITY_BASE` and reuse it in `routes.ts`. Small link, awkward (strip `/` for route segments).

**Option B — add pattern strings to `Routes`**  
e.g. `Routes.communityPatterns.root = "c/:slug"`. `routes.ts` imports patterns; builders stay for links. Medium effort, good enough for a one-line URL flatten.

**Option C — one registry, generate everything**  
Describe each route once; derive both the route tree and the URL builders. Described below.

---

## Option C in plain terms

**Idea:** define every route **once** in a data structure, then generate:

1. `app/routes.ts` (or its equivalent export) for React Router
2. `Routes.community.event(slug, id)` (and friends) for the app

One source of truth. Change the registry → route tree and link helpers both update.

### Sketch

```ts
// app/shared/lib/routing/registry.ts (hypothetical)

const communityRoutes = {
  root: {
    pattern: "c/:slug",           // for routes.ts (no leading /)
    file: "routes/web/community.tsx",
    children: {
      events: {
        pattern: "events",
        file: "routes/web/events-layout.tsx",
        index: "routes/web/events-index.tsx",
      },
      event: {
        pattern: "events/:eventId",
        file: "routes/web/event-detail.tsx",
      },
      // ...
    },
  },
} as const;

// Generators (hypothetical):
// - toRouteConfig(communityRoutes)  → RouteConfig[] for @react-router/dev/routes
// - toRoutesClass(communityRoutes)  → Routes.community.* builders
```

At runtime, `Routes.community.event("luhive", "42")` would be built from the same `pattern` chain as the router uses.

### What you gain

- **True single source of truth** — no drift between `routes.ts` and `Routes`
- **Safer URL migrations** — flatten `/c/:slug` → `/:slug` in one place
- **Room for extras** — reserved slugs, param validation, typed `params` from patterns (if you invest in TS)

### What it costs

- **More abstraction** — harder to read than today’s flat `routes.ts`
- **React Router nesting** — children must stay **relative** segments; the generator must handle `layout`, `index`, and standalone routes (e.g. `c/:slug/collaboration-invite/:id` outside the community layout)
- **Build-time vs runtime** — `routes.ts` is consumed by the React Router Vite plugin; the registry either feeds that file or replaces it with a generated module (needs a small codegen step or a `routes.ts` that only re-exports `toRouteConfig(registry)`)
- **Maintenance** — every new route touches the registry schema, not just two familiar files

### When to consider Option C

Worth it if:

- You change URL structure often (rebrand, i18n prefixes, multi-tenant paths)
- `routes.ts` and `Routes` keep drifting out of sync
- You want typed route params everywhere (`params.slug` inferred from the registry)

**Not worth it yet** if:

- Occasional URL tweaks are fine (edit `Routes` + one line in `routes.ts`)
- The team prefers obvious, grep-friendly `app/routes.ts`

## Practical recommendation (today)

Stay on the current setup:

- **`Routes` class** for all links and redirects
- **`app/routes.ts`** for the route tree

For a community URL flatten, Option B is usually enough: add `communityPatterns` to the class and reference them in `routes.ts`.

Revisit Option C when route count or URL churn makes manual dual maintenance painful.
