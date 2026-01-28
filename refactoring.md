# Refactoring (Iteration 1)

This document captures **what was changed in the first refactoring iteration** and **why** those changes were made. The goal is to improve structure and maintainability **without changing functionality**.

## Scope of Iteration 1

Iteration 1 focuses on **Phase 1 (utilities + validation foundations)** and the start of **Phase 2 (service layer foundations)** from the plan, plus applying those foundations to **one concrete place** (`dashboard/$slug.edit.tsx`) to remove duplication safely.

## What changed (and why)

### 1) Extracted reusable text utility

- **Added**: `app/lib/utils/text.ts`
  - Exports `countWords(text: string): number`
- **Why**:
  - `countWords` was duplicated inside `app/routes/dashboard/$slug.edit.tsx` (once in the `action` and again in the React component).
  - Centralizing it reduces duplication and ensures consistent word-count behavior everywhere.

### 2) Added generic URL validation helpers

- **Added**: `app/lib/utils/validation.ts`
  - `isValidUrl(...)`
  - `isValidExternalUrl(...)`
- **Why**:
  - URL validation logic appears in multiple places (event forms, etc.). Consolidating it prevents divergence and makes later refactors safer.
  - `isValidExternalUrl` is kept separate to allow domain-specific rules later without touching all call sites (even though it currently delegates to `isValidUrl`).

### 3) Added URL utilities module

- **Added**: `app/lib/utils/url.ts`
  - `safeParseUrl(...)`
  - `getHostname(...)`
- **Why**:
  - Establishes a single home for URL parsing/derivation helpers, keeping route/component code smaller and more readable.

### 4) Introduced centralized Zod schemas (foundation)

- **Added**:
  - `app/schemas/community.schema.ts`
  - `app/schemas/event.schema.ts`
  - `app/schemas/auth.schema.ts`
- **Why**:
  - Validation rules were embedded directly in route/component files (e.g., auth register route). Centralizing schemas enables consistent validation and reduces copy/paste logic.
  - In this iteration, schemas are introduced as a foundation; wiring them into all routes/forms is part of later iterations.

### 5) Introduced initial service layer (foundation)

- **Added**:
  - `app/services/communities.service.ts`
  - `app/services/events.service.ts`
  - `app/services/registrations.service.ts`
  - `app/services/profiles.service.ts`
- **Why**:
  - The app currently performs Supabase queries directly in many routes and components (query scattering).
  - Services provide a single place to implement and reuse data-access logic, improve readability, and reduce duplication.
  - In this iteration, services are introduced as a starting point; later iterations will migrate more routes/components to call these services.

### 6) Extracted reusable word-count UI logic into a hook

- **Added**: `app/hooks/use-word-count.ts`
  - A small hook that uses `countWords` and returns `{ wordCount, handleChange, setWordCount }`
- **Why**:
  - `dashboard/$slug.edit.tsx` had repeated logic for tracking word counts and updating state. A hook makes it reusable and keeps the component focused on rendering.

### 7) Refactored a single route to use the new shared logic (no behavior change)

- **Updated**: `app/routes/dashboard/$slug.edit.tsx`
  - Replaced duplicated inline `countWords` with `import { countWords } from '~/lib/utils/text'`
  - Replaced component-local word-count handlers with `useWordCount(...)`
- **Why**:
  - This is a low-risk first migration that proves the new structure works and reduces duplication immediately.
  - It keeps existing behavior the same while improving separation of concerns.

## What did NOT change (intentionally)

- No routes were moved/renamed yet.
- No major query migrations were performed yet (beyond introducing services).
- No landing page consolidation yet.
- No component file moves/renames yet (PascalCase / domain folders).
- No Supabase client/server file renames yet.

These are planned for subsequent iterations to keep each change set small and safe.

## Files introduced/updated in Iteration 1

### Added
- `app/lib/utils/text.ts`
- `app/lib/utils/validation.ts`
- `app/lib/utils/url.ts`
- `app/schemas/community.schema.ts`
- `app/schemas/event.schema.ts`
- `app/schemas/auth.schema.ts`
- `app/services/communities.service.ts`
- `app/services/events.service.ts`
- `app/services/registrations.service.ts`
- `app/services/profiles.service.ts`
- `app/hooks/use-word-count.ts`

### Updated
- `app/routes/dashboard/$slug.edit.tsx`

# Refactoring (Iteration 2)

Iteration 2 continues the plan by implementing **compatibility shims for the new folder structure**, introducing the remaining planned hooks, and migrating a few high-impact parts of the app to the **service layer** while keeping behavior unchanged.

## What changed (and why)

### 1) Added “new structure” entrypoints without breaking old imports

Instead of moving/deleting files immediately (high risk), we created **new canonical paths** that re-export existing modules. This allows us to update imports gradually and keep the app working throughout the refactor.

- **Added (navigation re-export entrypoints)**:
  - `app/components/navigation/NavMain.tsx`
  - `app/components/navigation/NavUser.tsx`
  - `app/components/navigation/NavSecondary.tsx`
  - `app/components/navigation/NavDocuments.tsx`
- **Updated**:
  - `app/components/app-sidebar.tsx` to import from `~/components/navigation/*`
- **Why**:
  - Enables the planned `components/navigation/` organization while keeping the original `app/components/nav-*.tsx` files untouched and working.

- **Added (community component entrypoints)**:
  - `app/components/community/ProfilePictureUpload.tsx`
  - `app/components/community/CoverPictureUpload.tsx`
  - `app/components/community/JoinCommunityForm.tsx`
- **Updated**:
  - `app/routes/dashboard/$slug.edit.tsx` to import `ProfilePictureUpload` from the new location
  - `app/routes/community.tsx` to import `JoinCommunityForm` + `CoverPictureUpload` from the new location
- **Why**:
  - Matches the planned `components/community/` organization with minimal risk by using re-exports first.

### 2) Implemented Supabase “renamed” paths using safe shims

- **Added**:
  - `app/lib/supabase/client.ts`
  - `app/lib/supabase/server.ts`
- **Updated**:
  - `app/lib/supabase.client.ts` → re-export from `~/lib/supabase/client`
  - `app/lib/supabase.server.ts` → re-export from `~/lib/supabase/server`
- **Why**:
  - The plan calls for `lib/supabase/{client,server}.ts`. This change introduces the new structure while keeping all existing imports (`~/lib/supabase.client` and `~/lib/supabase.server`) functional.

### 3) Added utils index entrypoint

- **Added**: `app/lib/utils/index.ts` re-exporting from `app/lib/utils.ts`
- **Why**:
  - The plan calls for `lib/utils/index.ts`. This is introduced as a compatibility entrypoint without changing how existing code imports `~/lib/utils`.

### 4) Added planned service “renamed” entrypoints

- **Added**:
  - `app/services/object-storage.service.ts` (re-export)
  - `app/services/sentry.service.ts` (re-export)
- **Updated**:
  - `app/routes/dashboard/$slug.edit.tsx` to import storage helpers from `~/services/object-storage.service`
- **Why**:
  - Matches the planned naming without forcing a risky rename/move of the existing `app/services/object-storage.ts` and `app/services/sentry.ts` yet.

### 5) Added remaining planned hooks

- **Added**:
  - `app/hooks/use-community.ts`
  - `app/hooks/use-events.ts`
- **Why**:
  - These hooks provide a consistent pattern for data loading + error handling as we migrate more components to the services layer.

### 6) Migrated selected event data fetching to the services layer (no behavior change)

- **Updated**:
  - `app/routes/dashboard/$slug.event.tsx`
    - Fetch events + registration counts via `getEventsWithRegistrationCountsClient`
    - Delete events via `deleteEventClient`
  - `app/components/events/event-list.tsx`
    - Fetch upcoming published events via `getEventsByCommunityClient`
  - `app/components/events/events-content.tsx`
    - Fetch upcoming/past published events via `getEventsByCommunityClient`
- **Why**:
  - These areas had repeated Supabase queries and similar filters. Moving them behind service functions reduces duplication and makes further refactors easier.

## Files introduced/updated in Iteration 2

### Added
- `app/components/navigation/NavMain.tsx`
- `app/components/navigation/NavUser.tsx`
- `app/components/navigation/NavSecondary.tsx`
- `app/components/navigation/NavDocuments.tsx`
- `app/components/community/ProfilePictureUpload.tsx`
- `app/components/community/CoverPictureUpload.tsx`
- `app/components/community/JoinCommunityForm.tsx`
- `app/lib/supabase/client.ts`
- `app/lib/supabase/server.ts`
- `app/lib/utils/index.ts`
- `app/services/object-storage.service.ts`
- `app/services/sentry.service.ts`
- `app/hooks/use-community.ts`
- `app/hooks/use-events.ts`

### Updated
- `app/components/app-sidebar.tsx`
- `app/routes/dashboard/$slug.edit.tsx`
- `app/routes/community.tsx`
- `app/routes/dashboard/$slug.event.tsx`
- `app/components/events/event-list.tsx`
- `app/components/events/events-content.tsx`
- `app/lib/supabase.client.ts`
- `app/lib/supabase.server.ts`
- `app/lib/utils/validation.ts`

# Refactoring (Iteration 3)

Iteration 3 continues executing the original refactoring plan by (a) consolidating landing components behind a single `landing/` entrypoint, (b) extracting community join/registration schemas, (c) introducing shared community types, and (d) reducing validation duplication in the auth flow.

## What changed (and why)

### 1) Extracted community join schemas into `schemas/registration.schema.ts`

- **Added**: `app/schemas/registration.schema.ts`
  - `guestJoinSchema`, `memberJoinSchema`
  - `GuestJoinFormValues`, `MemberJoinFormValues`
- **Updated**: `app/components/join-community-form.tsx`
  - Now imports schemas and types from `~/schemas/registration.schema`
  - Removed inline Zod schema definitions
- **Why**:
  - Centralizes community-join validation logic and makes it reusable across other flows that may need the same semantics (e.g., server-side validation in future).

### 2) Introduced shared community types

- **Added**: `app/models/community.types.ts`
  - `Community` and `CommunityMember` aliases based on generated `Database` types
- **Why**:
  - Provides a single, semantic place to import community-related types, matching the plan’s `models/community.types.ts` entry and improving readability across services/routes over time.

### 3) Consolidated landing v2 components behind `components/landing/`

- **Added (v2 re-export entrypoints)**:
  - `app/components/landing/LandingNavbarV2.tsx`
  - `app/components/landing/LandingAboutV2.tsx`
  - `app/components/landing/LandingPartnersV2.tsx`
  - `app/components/landing/LandingFeaturesV2.tsx`
  - `app/components/landing/LandingPricingV2.tsx`
  - `app/components/landing/LandingBlogsV2.tsx`
  - `app/components/landing/LandingFAQV2.tsx`
  - `app/components/landing/LandingFooterV2.tsx`
  - Each file re-exports from the corresponding `components/landingv2/*` implementation.
- **Updated**: `app/routes/index.tsx`
  - All v2 imports now come from `~/components/landing/*` instead of `~/components/landingv2/*`
- **Why**:
  - Moves external usage onto the planned single `landing/` directory while keeping the existing v2 implementations intact.
  - Prepares for a future cleanup where legacy v1 landing components can be safely removed once confirmed unused.

### 4) Removed duplicated auth registration schema

- **Updated**: `app/routes/register.tsx`
  - Replaces the local Zod `registerSchema` definition with the shared `registerSchema` from `~/schemas/auth.schema`
- **Why**:
  - Eliminates duplicated validation rules between `auth.schema.ts` and the `register` route, aligning with the plan’s goal to centralize validation logic.

## Files introduced/updated in Iteration 3

### Added
- `app/schemas/registration.schema.ts`
- `app/models/community.types.ts`
- `app/components/landing/LandingNavbarV2.tsx`
- `app/components/landing/LandingAboutV2.tsx`
- `app/components/landing/LandingPartnersV2.tsx`
- `app/components/landing/LandingFeaturesV2.tsx`
- `app/components/landing/LandingPricingV2.tsx`
- `app/components/landing/LandingBlogsV2.tsx`
- `app/components/landing/LandingFAQV2.tsx`
- `app/components/landing/LandingFooterV2.tsx`

### Updated
- `app/components/join-community-form.tsx`
- `app/routes/index.tsx`
- `app/routes/register.tsx`
- `refactoring.md` (this documentation)

