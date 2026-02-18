# Full Modular Refactoring Plan

## Current State Summary

- **9 modules** (`hub`, `auth`, `landing`, `profile`, `community`, `events`, `dashboard`, `integrations`) follow the thin-adapter pattern
- **Community** and **event-detail** routes are now thin adapters; logic in modules
- **Dashboard is fully CSR** via hooks (`useDashboardCommunity`) -- intentional, stays CSR
- **app/shared/** created with lib (utils, supabase), hooks (use-mobile, use-word-count), components (ui)
- **app/components/ui/** and **app/hooks/** re-export from shared; gradual migration path

---

## Architecture Target

```
app/routes/           --> Thin adapters (3-5 lines, re-export loader/action/meta/default)
app/modules/          --> Feature modules (model, data, server, components, hooks, page)
app/shared/           --> Cross-cutting (components/ui, hooks, lib)
```

Each route file becomes a thin adapter. All business logic, data access, and UI live inside the module.

---

## 1. Module Breakdown

### Module Structure (per app/modules/README.md)

```
modules/<feature>/
  model/           # Types, Zod schemas, meta
  data/            # Repos: Supabase queries (.server.ts / .client.ts)
  server/          # Loaders, actions (.server.ts)
  components/      # Module-local UI (flat, no atoms/organisms)
  hooks/           # CSR hooks for this module
  utils/           # Module-local helpers
  page.tsx         # Route entry
```

### 1b. modules/community/ (Pending)

Extract from: `app/routes/web/community.tsx` (~1010 lines), create-community, create-community-success.

- **Join/leave** uses `useFetcher` + resource route (not page action)
- Break into: community-profile-card, community-stats, community-quick-actions, community-social-links, join-community-form
- Absorb communities.service.ts into data/ repos

### 1c. modules/events/ (Pending)

Extract from: event-detail.tsx (~1160 lines), events index, layout, verify, verification-sent.

- **Registration** uses `useFetcher` + resource routes
- Break into: event-header, event-details-section, registration-section
- Move all app/components/events/* into module
- Absorb events.service, registrations.service

### 1d. modules/auth/ (Done)

Login, register, forgot-password, verify, logout, verify-reset-password. All use SSR loaders + actions.

### 1e. modules/dashboard/ (Pending - Stays CSR)

- **Fully CSR** -- one minimal SSR loader (auth check only)
- All data via hooks: useDashboardCommunity, useDashboardEvents, etc.
- Mutations via direct Supabase client calls
- Remove use-dashboard-auth.ts (unused)

### 1f. modules/landing/ (Done)

Static landing page. Components moved to module.

### 1g. modules/integrations/ (Pending)

**Providers pattern** for extensibility. Each integration (Google Forms, Tally, Notion) gets `providers/<name>/` with data, server, components, hooks. Shared `integration-types.ts` interface. Adding Tally = add folder, no changes elsewhere.

### 1h. modules/profile/ (Done)

SSR loader + action. Profile form and avatar upload.

---

## 2. Shared Layer (app/shared/)

- **components/ui/** -- shadcn primitives (moved, app re-exports)
- **components/** -- navigation, footer, data-table, cover-upload, chart-area-interactive
- **hooks/** -- use-mobile, use-word-count
- **lib/** -- utils (cn, time, text, url, validation, error-handling), supabase, constants

---

## 3. SSR vs CSR Strategy

| Zone | Pattern | Rationale |
|------|---------|------------|
| Public (hub, community, event) | SSR loaders + useFetcher for mutations | SEO, fast first paint |
| Auth | SSR loaders + actions | Page purpose = form submission |
| Dashboard | **Fully CSR** | No SEO, SPA feel, real-time |
| API routes | SSR only | Resource routes |

### Mutation Decision

- **Dashboard?** → Direct hook (Supabase client)
- **Page-primary form?** → SSR action (login, register, create community)
- **Modal/dialog on public page?** → useFetcher + resource route (join, event registration)

---

## 4. Cross-Module Import Rules

**Allowed:** `model/` (types), `components/` (UI)

**Forbidden:** `server/`, `data/`, `hooks/` (each module owns its own)

**Promotion:** Component used by 3+ modules → move to `app/shared/`

---

## 5. KISS Component Strategy

No atoms/molecules/organisms. Flat structure:

1. `app/shared/components/ui/` -- shadcn primitives
2. `app/shared/components/` -- shared composed
3. `modules/*/components/` -- module-local, flat, max ~200 lines

---

## 6. Cleanup (Phase 8)

After all modules populated:

- Delete empty app/components/, app/hooks/, app/lib/, app/services/, app/models/, app/schemas/
- Rename to kebab-case per docs/file-convention.md
- Remove legacy re-exports, use-dashboard-auth.ts

---

## 7. Migration Order

1. Phase 0: app/shared/ ✓
2. Phase 1: auth ✓
3. Phase 2: landing ✓
4. Phase 3: profile ✓
5. Phase 4: community
6. Phase 5: events
7. Phase 6: dashboard
8. Phase 7: integrations
9. Phase 8: cleanup

---

## 8. Import Path Convention

- `~/modules/<feature>/server/<name>.server` -- module internals
- `~/shared/components/ui/<name>` -- shared UI
- `~/shared/lib/<path>` -- shared lib
- `~/shared/hooks/<name>` -- shared hooks

---

## 9. Architectural Q&A

### Q1: How to handle future integrations (Tally, Notion)?

Use **providers pattern** in `modules/integrations/`. Each integration gets `providers/<name>/` with data, server, components, hooks. Shared `IntegrationProvider` interface. Add provider = add folder.

### Q2: Can dashboard import from events module?

Yes, from `model/` and `components/` only. Never from `server/` or `data/`. Dashboard has its own CSR data flow.

### Q3: Should dashboard use SSR?

No. Dashboard stays **fully CSR**. One minimal layout loader for auth check. All data via hooks.

### Q4: Join community – action or hook?

- **Modal on public page** → `useFetcher` + resource route (keeps RLS, no page bloat)
- **Page-primary form** → SSR action
- **Dashboard** → Direct hook

Resource route: `routes/api/join-community.tsx` re-exports action from module. Component uses `useFetcher` to call it.
