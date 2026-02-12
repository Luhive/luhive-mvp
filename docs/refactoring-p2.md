# Refactoring Phase 2 – February 2026

## Overview

This phase introduces modular architecture and route grouping: Hub as the first module and `app/routes` organized by domain.

---

## 1. Hub Module

### Goal

Move Hub logic out of a monolithic route into a module with clear separation of model, data, server, and UI.

### Structure

```
app/modules/hub/
  model/
    hub.types.ts      Community, UserData, HubData, HubLoaderData
    hub.meta.ts       SEO meta for /hub
  data/
    hub.repo.server.ts  Supabase queries (visible communities, counts, user profile)
  server/
    hub.loader.server.ts  Deferred loader orchestration
  components/
    hub-header.tsx
    hub-empty-state.tsx
    community-card.tsx
    community-grid.tsx
  page.tsx           Composes components, Suspense + Await
```

### Changes

- Types centralized in `hub.types.ts` (`HubData`, `HubLoaderData` instead of ad-hoc shapes)
- Supabase access in `hub.repo.server.ts`; loader in `hub.loader.server.ts`
- Route `app/routes/web/hub.tsx` re-exports loader, meta, and default page only
- No runtime behavior change; same URLs and data flow

---

## 2. Routes Grouping

### Goal

Group route files by domain so `app/routes` is easier to navigate.

### Structure

```
app/routes/
  web/                Public pages with nav layout
    index.tsx, hub.tsx, profile.tsx, community.tsx, create-community*.tsx
  auth/               Auth flows
    login.tsx, register.tsx, logout.tsx, forgot-password.tsx,
    auth.verify.tsx, auth.reset-password.tsx, verify-email-sent.tsx, reset-password-email-sent.tsx
  layouts/
    navigation-layout.tsx
  api/                API handlers
    attenders-list.tsx, email-debug.tsx, update-registration-status.tsx
    google-forms/
      auth.tsx, callback.tsx, status.tsx, list.tsx, disconnect.tsx, $formId.tsx, $formId.responses.tsx
  dashboard/          Unchanged
  community-events/   Unchanged
  error.tsx           Root
```

### Changes

- Web routes moved into `web/`
- Auth routes moved into `auth/`
- API routes moved into `api/` and `api/google-forms/`
- Layout moved to `layouts/`
- `app/routes.ts` updated with new file paths
- `routes/web/index.tsx` import fixed: `../lib/i18n` → `../../lib/i18n`

### Invariants

- No URL changes
- No logic changes; only file locations
- Dashboard and community-events layouts unchanged

---

## 3. Route Adapter Pattern

Hub is the first route to follow the thin-adapter pattern. The route file only re-exports:

```ts
export { loader } from "~/modules/hub/server/hub.loader.server";
export { meta } from "~/modules/hub/model/hub.meta";
export { default } from "~/modules/hub/page";
```

Other routes still contain logic; they can be migrated gradually to this pattern.

---

## 4. Follow-up

- Apply the same module pattern to community, dashboard, events
- Turn remaining route files into thin adapters
- Add `docs` notes for any new modules or conventions
