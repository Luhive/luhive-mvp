# Stage 0 — Workspace Migration

Ground truth before anything else. Full context in `docs/spec-moc.md`; stage gates in `docs/spec/15 Stages and Gates.md`.

**Nothing here changes application behaviour.** It moves files, adds a workspace, and gets the database schema into git. If a task requires a product change, it is out of scope.

## Order

```
#1  security fixes ─────────── independent, ship on its own

#2  workspace root
 └─ #3  move → apps/web
     └─ #4  fix build config
         └─ #5  VERIFY web deploys  ◄── hard gate
             ├─ #6  apps/integration ── #10 CI
             └─ #7  packages/db skeleton
                 └─ #8  drizzle pull + reconcile migrations
                     └─ #9  web uses @luhive/db
```

---

## #1 · Close the two unauthenticated service-role endpoints

Independent of the workspace. Live risk right now — ship separately.

- [x] `app/modules/events/server/api-attenders-list.server.tsx` used `createServiceRoleClient()`, which bypasses RLS, with **no auth check** — any GET with an `eventId` returned the attendee roster. **Decision: stays public-by-design, but scoped.** The loader now resolves the event first and returns 404 unless `status = 'published'` and the owning community has `is_show = true`. No rate limit; there is no rate-limiting infrastructure in the repo and adding one is out of scope for Stage 0.
- [x] `app/modules/events/server/api-email-debug.server.tsx` returned email configuration to unauthenticated callers. Handler and `app/routes/api/events/email-debug.tsx` deleted; route removed from `app/routes.ts` and `Routes.api.events.emailDebug` removed from `app/shared/lib/routing/routes.ts`.

**Gate:** ~~neither endpoint returns data to an unauthenticated caller~~ — revised. `email-debug` is gone entirely. `attenders-list` stays anonymous-readable because the same roster already renders on public event pages, but it is no longer enumerable across draft events or hidden communities.

**Known side effect:** the event detail loader does not filter on `status`, so a `cancelled` event page is still publicly reachable — its attendee avatars now render empty. Relax the guard to `status !== 'draft'` if that matters.

**Still open:** `getEmailConfig()` in `app/shared/lib/email.server.ts` is now unused. Left in place deliberately — deleting it is cleanup off the migration path.

---

## #2 · Create the pnpm workspace root

**Decision:** `luhive-mvp` becomes the workspace root rather than a fresh repo — keeps the git remote, the Netlify project link, and the 409 commits as the main history line. Integration arrives later as a subtree.

- [x] `pnpm-workspace.yaml` — already existed with `packages/*` and `apps/*`; left as-is
- [x] `catalog:` block pinning `zod ^4.1.12`, `hono ^4`, `@supabase/supabase-js ^2.75.0`, `drizzle-orm ^0.44`, per `docs/spec/03`. The zod and supabase pins match `apps/web`'s current specifiers exactly, so adopting `catalog:` there later resolves to what it already has. Nothing references the catalog yet, so `pnpm install --frozen-lockfile` still reports the lockfile up to date.
- [x] Carry existing `allowBuilds` / `ignoredBuiltDependencies` — already present in the same file, untouched
- [ ] **Root `package.json` — deferred to #3, cannot be done here.** The root `package.json` *is* the web app right now (`luhive-web-app`, all 90 deps). A workspace root file can only be written at the moment `git mv package.json apps/web/package.json` happens, otherwise the repo has either two competing roots or none. Doing it in #2 would violate this stage's own "nothing has moved" gate. Content when #3 runs: private, no deps, scripts `typecheck`/`build`/`test`/`dev` as `pnpm -r` passthroughs, and the existing `packageManager: pnpm@10.22.0+sha512...` line carried over verbatim.
- [x] `tsconfig.base.json` — created. Deliberately narrow: `target`, `module`, `moduleResolution`, `esModuleInterop`, `resolveJsonModule`, `skipLibCheck`, `strict`, `noEmit`. Every value is identical to what `apps/web/tsconfig.json` already sets, so wiring `extends` in #4 changes nothing. **No `paths`, no `baseUrl`, no `lib`, no `types`, no `jsx`, no `rootDirs`** — all app-specific, and `lib`/`types` are exactly what would break a Workers build if inherited.

**Gate:** nothing has moved; the repo builds exactly as before. **Verified:** `pnpm install --frozen-lockfile` clean, `pnpm build` exits 0, `pnpm typecheck` still at its 15-error pre-existing baseline (unchanged before and after).

Note: `pnpm build` emits a Sentry sourcemap upload failure when the network is restricted. Non-fatal, pre-existing, and #4 authorises removing Sentry.

---

## #3 · Move the existing app into `apps/web`

Blocked by #2.

- [ ] `git mv` the app — `app/`, `public/`, build config, `package.json`, `netlify.toml`, `supabase/`
- [ ] Keep `docs/` at the repo root; the spec symlinks live there and cover all apps
- [ ] Verify history followed: `git log --follow apps/web/app/root.tsx` should show the full history

**Use `git mv`, never a copy.** Those 409 commits — 100 of them bug fixes, 32 on OAuth/OTP — were the evidence that decided against a rewrite. Losing them is not recoverable.

**Gate:** `git log --follow` on a moved file shows its pre-move commits.

---

## #4 · Fix `apps/web` build config

Blocked by #3. Three predictable breakages:

- [ ] **Path aliases.** `~/` resolves relative to `app/` across ~56k LOC. `apps/web/tsconfig.json` keeps its own `paths` block and must not inherit a conflicting one from `tsconfig.base.json`. Check `vite-tsconfig-paths` still resolves.
- [ ] **Netlify.** `netlify.toml` assumes the repo root is the app. Needs a base directory, and the build command must install from the workspace root so workspace deps resolve.
- [ ] **Vite / React Router.** `vite.config.ts`, `react-router.config.ts`, and the `.react-router/` typegen output path.
- [ ] Also check `instrument.server.mjs`, Sentry config, and `netlify/edge-functions/`. (You can remove sentry entirely)

---

## #5 · Verify `apps/web` runs and deploys — HARD GATE

Blocked by #4. **Do not start any other app until this passes.**

- [ ] `pnpm install` from the root resolves
- [ ] `pnpm --filter web dev` serves; pages render
- [ ] `pnpm --filter web typecheck` clean (baseline pre-existing errors if any)
- [ ] `pnpm --filter web build` succeeds
- [ ] Netlify **deploy preview** builds, and auth + an event page + the dashboard all work

The MVP is live for Enhance Azerbaijan, Azerbaijan Startup Community and GDG Baku. A broken deploy here is a real outage, not an inconvenience.

---

## #6 · Bring in `apps/integration`

Blocked by #5. Source: `/Users/alistein/Documents/Luhive/LuhiveIntegrationAPI` — 458 LOC, Hono on Cloudflare Workers, has tests and 17 architecture docs.

- [ ] `git subtree add --prefix=apps/integration <remote> <branch>` — history comes along, not a file copy
- [ ] Decide where its `docs/` lands; do not leave two doc trees
- [ ] Check `wrangler.jsonc` paths and the deploy script from the new location
- [ ] Its `vitest.config.ts` should be picked up by root `pnpm -r test`
- [ ] Leave `db/0001_api_keys.sql` alone — reconciling migrations is #8

---

## #7 · Create `packages/db` skeleton

Blocked by #5. Empty but wired, so drizzle has somewhere to land.

- [ ] `packages/db/package.json` — `@luhive/db`, private
- [ ] **Exports map**, so a Workers build cannot reach the Node client:
  - `.` → `./src/schema.ts` — drizzle schema + inferred types, universal
  - `./http` → `./src/http.ts` — supabase-js, Workers-safe
  - `./node` → `./src/node.ts` — `pg` pool, Node only

  Without this, someone imports `pg` on a shared path and it surfaces at `wrangler deploy`, not at typecheck.
- [ ] `drizzle.config.ts` pointing at the Supabase connection string
- [ ] Empty `migrations/`
- [ ] tsconfig extending `tsconfig.base.json`

No schema content yet.

---

## #8 · Pull the real schema and reconcile migrations

Blocked by #7. **This is the point of Stage 0.**

7 of 15 tables have no migration anywhere — `communities`, `community_members`, `events`, `event_registrations`, `profiles`, `community_visits`, `community_waitlist`. They exist only in the Supabase dashboard, so production cannot be rebuilt and no schema change can be reviewed.

- [ ] `drizzle-kit pull` against the live database → `packages/db/src/schema.ts`
- [ ] Bring the 20 existing `supabase/migrations/*.sql` and integration's `db/0001_api_keys.sql` into one lineage under `packages/db/migrations/`
- [ ] Carry existing RLS policies across as raw SQL migrations — drizzle supports custom SQL, and those policies still protect the MVP's browser-side queries
- [ ] Sanity-check against `app/shared/models/database.types.ts`

Note: the `events` table is **calendar** events. The behavioural table added later is `person_event` — the collision is deliberate to avoid.

**Gate:** a fresh database built from `packages/db/migrations/` matches production.

---

## #9 · Point `apps/web` at `@luhive/db` types

Blocked by #8.

- [ ] `app/shared/models/entity.types.ts` re-exports from `@luhive/db` instead of the local generated file
- [ ] Delete `app/shared/models/database.types.ts` (892 lines) and the `supabase-types` script
- [ ] Expect typecheck to surface drift between the generated file and the real schema — those are real findings, not noise

First time both apps share one source of truth, and what makes a schema change break CI instead of production.

---

## #10 · CI

Blocked by #6. There is no `.github` directory in any repo today — nothing runs before a merge.

- [ ] `.github/workflows/ci.yml` on `pull_request` and pushes to `main` / `development`
- [ ] pnpm install with lockfile cache
- [ ] `pnpm -r typecheck` · `pnpm -r build` · `pnpm -r test`
- [ ] Baseline pre-existing type errors rather than blocking the pipeline; track cleanup separately

Only mechanism that will catch a `packages/db` change breaking `apps/integration` — a silent failure mode today, and a live one the moment both apps share a schema.

---

## Out of scope for Stage 0

- Creating `apps/core` — that is Stage 1
- Any change to `app/modules/events/**` beyond what the move requires
- Refactoring anything not required to make the workspace build
- Provisioning GCP — the Supabase region must be identified first, since core's region must match it
