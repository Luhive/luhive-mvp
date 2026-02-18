# Main Architecture (Current)

## 1) Routes (Source of Truth for Pages)

Routes define page composition and routing behavior.

- Page UI lives in `app/routes/**` (not in module `page.tsx` files)
- Route files can export: `loader`, `action`, `clientLoader`, `meta`, `default`
- Routes call module repos/hooks/components; modules do not own the route tree
- API endpoints also live in routes as resource routes (`app/routes/api/**`)

Current high-level route groups:

```
routes/
  web/
  auth/
  dashboard/
  api/
  error.tsx
```

## 2) Modules (Domain Logic + UI Pieces)

Feature-first modules encapsulate reusable domain logic and components.

```
modules/<feature>/
  model/         schema, types, meta, domain models
  data/          repos (query/mutation access)
  server/        server-only handlers and route-side server logic
  components/    module-local UI building blocks
  hooks/         feature hooks (CSR state, orchestration)
  utils/         feature-local helpers
```

### Model Folder Explained

`model/` keeps domain definition, not runtime orchestration:

- `schema` -> Zod schemas / validation contracts
- `types` -> TS contracts and domain aliases/interfaces
- `models` -> domain-level structured types/constants (if needed)
- `meta` -> route meta builders (`meta()` helpers for SEO/page metadata)

Keep `model/` pure and dependency-light.

## 3) Shared (Cross-cutting Only)

`app/shared/**` is for code used by multiple domains.

Typical contents:

- `shared/lib/**` -> generic utilities, monitoring, supabase clients, storage helpers
- `shared/components/**` -> reusable cross-domain UI
- `shared/hooks/**` -> cross-domain hooks
- `shared/model/**` -> global types (example: generated database types)

Rule: if code is domain-specific (events/community/dashboard), keep it in that module.

## 4) File Naming Conventions (`.server`, `.client`, `.repo`)

- `*.server.ts(x)` -> server-only code (safe from client bundle)
- `*.client.ts(x)` -> browser-only logic (UI/browser APIs/client SDK usage)
- `*-repo.client.ts` / `*-repo.server.ts` -> data access layer (queries/mutations)

Recommended patterns:

- `modules/events/data/events-repo.client.ts`
- `modules/events/server/event-detail-loader.server.ts`
- `routes/dashboard/overview.tsx` (page route using repos/hooks)

## 5) SSR vs CSR in This Project

Use SSR-style route handlers when request/response flow is needed:

- `loader` / `action` for server-side orchestration
- `useFetcher()` for non-navigation form/API interactions
- Good for auth-sensitive writes, secure reads, redirects, and cookie-aware flows

Use CSR-style loading when page is intentionally client-driven:

- `clientLoader` in route file for initial client data bootstrap
- module hooks for splitting logic across components
- repos called from `clientLoader`/hooks for clean separation

Practical guideline:

- Prefer `loader/action` for secure server concerns
- Prefer `clientLoader + hooks` for dashboard-like interactive CSR flows

## 6) Boundaries and Rules

- Components do not call Supabase directly unless intentionally a repo-level concern
- Repos should stay data-focused (no route redirects or UI state)
- Route files orchestrate: call repos, handle redirect/error strategy, shape page data
- Shared stays generic; modules stay domain-scoped