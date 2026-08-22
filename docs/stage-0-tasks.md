# Stage 0 — Workspace Migration

Ground truth before anything else. Full context in `docs/spec-moc.md`; stage gates in `docs/spec/15 Stages and Gates.md`.

**Nothing here changes application behaviour.** It moves files, adds a workspace, and gets the database schema into git. If a task requires a product change, it is out of scope.

**Revised 2026-08-21 — the query layer is Kysely, not Drizzle.** Decision and rationale in `docs/spec-moc.md` under *Data & runtime*: the database stays the source of truth, migrations are hand-written SQL, types are generated from the live schema. **Nothing already shipped is affected** — #1–#5 moved files and fixed build config and never touched the data layer. What changes is #7, #8 and #9, plus a one-line correction to the catalog written in #2.

## Order

```
#1  security fixes ─────────── independent, ship on its own

#2  workspace root
 └─ #3  move → apps/web
     └─ #4  fix build config
         └─ #5  VERIFY web deploys  ◄── hard gate
             ├─ #6  apps/integration-api ── #10 CI
             └─ #7  packages/db skeleton
                 └─ #8  schema baseline + reconcile migrations
                     └─ #9  web uses @luhive/db
```

## Naming

Directory and package name match, so `--filter` is predictable and nothing has two identities.

| Directory | Package name | What it is |
|---|---|---|
| `apps/web` | `@luhive/web` | React Router app → Netlify |
| `apps/core-api` | `@luhive/core-api` | private backend → GCP Cloud Run *(Stage 1)* |
| `apps/integration-api` | `@luhive/integration-api` | public customer API → Cloudflare Workers |
| `packages/db` | `@luhive/db` | SQL migrations, generated types |
| `packages/domain` | `@luhive/domain` | zod contracts, `Result` *(Stage 1)* |
| `packages/api-client` | `@luhive/api-client` | `ApiClient` *(Stage 1)* |

The current root `package.json` is named `luhive-web-app` — rename it to `@luhive/web` when it moves in #3. The `-api` suffix marks the two deployables that serve HTTP to another program; `web` serves a browser.

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
- [ ] **Correction, 2026-08-21.** The catalog above pins `drizzle-orm ^0.44`; the decision is now Kysely. Swap it for `kysely ^0.29` in `pnpm-workspace.yaml`. Safe at any point — nothing references the catalog yet and no package depends on either, so the lockfile is unaffected.
- [x] Carry existing `allowBuilds` / `ignoredBuiltDependencies` — already present in the same file, untouched
- [ ] **Root `package.json` — deferred to #3, cannot be done here.** The root `package.json` *is* the web app right now (`luhive-web-app`, all 90 deps). A workspace root file can only be written at the moment `git mv package.json apps/web/package.json` happens, otherwise the repo has either two competing roots or none. Doing it in #2 would violate this stage's own "nothing has moved" gate. Content when #3 runs: private, no deps, scripts `typecheck`/`build`/`test`/`dev` as `pnpm -r` passthroughs, and the existing `packageManager: pnpm@10.22.0+sha512...` line carried over verbatim.
- [x] `tsconfig.base.json` — created. Deliberately narrow: `target`, `module`, `moduleResolution`, `esModuleInterop`, `resolveJsonModule`, `skipLibCheck`, `strict`, `noEmit`. Every value is identical to what `apps/web/tsconfig.json` already sets, so wiring `extends` in #4 changes nothing. **No `paths`, no `baseUrl`, no `lib`, no `types`, no `jsx`, no `rootDirs`** — all app-specific, and `lib`/`types` are exactly what would break a Workers build if inherited.

**Gate:** nothing has moved; the repo builds exactly as before. **Verified:** `pnpm install --frozen-lockfile` clean, `pnpm build` exits 0, `pnpm typecheck` still at its 15-error pre-existing baseline (unchanged before and after).

Note: `pnpm build` emits a Sentry sourcemap upload failure when the network is restricted. Non-fatal, pre-existing, and #4 authorises removing Sentry.

---

## #3 · Move the existing app into `apps/web`

Blocked by #2.

- [x] `git mv` the app — all of the listed paths, plus `.netlify/` (the CLI state dir, which follows `netlify.toml`). `.env.development`, `.env.development.local` and `.env.production` moved with a plain `mv` since they are gitignored.
- [x] Rename the moved `package.json` to `@luhive/web`; root `package.json` written — private, no deps, `pnpm -r --if-present` passthroughs, `packageManager` carried verbatim. **`packageManager` was removed from `apps/web`** so corepack has one source of truth.
- [x] Leave `supabase/` at the root — caught late: it was moved with the rest and then moved back in `a46c29a`. Both directions are 100%-similarity renames, so `git log --follow` on a migration still traces through.
- [x] Keep `docs/`, `.cursor/`, `.agents/`, `.vscode/` at the repo root
- [x] Verify history followed

**Use `git mv`, never a copy.** Those 409 commits — 100 of them bug fixes, 32 on OAuth/OTP — were the evidence that decided against a rewrite. Losing them is not recoverable.

**Gate: passes.** `git log --follow apps/web/app/root.tsx` returns 18 commits ending at `16130b7 Initial commit from create-react-router`. `apps/web/package.json` keeps all 38. `git diff -M --summary` on the move commit was 631 entries, every one a `rename`, zero content changes.

**Deviation from the plan above — the root `package.json` is a separate commit, not the same one.** Recreating a file at a path that is simultaneously the source of a rename destroys the pairing: git stops seeing `package.json → apps/web/package.json` and records a plain add, silently dropping 38 commits of dependency history. Verified — staging both together dropped the rename count from 631 to 630. The move commit therefore deletes the root `package.json`, and `4791d77` adds the workspace one immediately after.

Commits: `e0bbadc` move · `4791d77` root manifest · `a46c29a` supabase back to root.

**The build is broken until #4, as expected.** `pnpm-lock.yaml` still records every dependency under the root importer (`.`) rather than `apps/web`, so `pnpm install --frozen-lockfile` will now fail. Regenerating it is #4's job, together with the Netlify base directory and the `~/` alias check.

---

## #4 · Fix `apps/web` build config

Blocked by #3. Three predictable breakages:

- [x] **Path aliases.** `apps/web/tsconfig.json` now `extends: "../../tsconfig.base.json"` and keeps `paths`, `baseUrl`, `lib`, `types`, `jsx`, `rootDirs` and `verbatimModuleSyntax` local. Since the file itself moved, `"~/*": ["./app/*"]` already resolved to `apps/web/app/*` unchanged. Proof it works: typecheck returns the *same 15 errors on the same lines* as before the move — a broken alias would have produced hundreds.
- [x] **Netlify.** Rewritten for the layout Netlify actually documents for pnpm workspaces. See the manual step below.
- [x] **Vite / React Router.** No path changes were needed. Vite's root is the config file's directory, so `build/` and `.react-router/` now land inside `apps/web` automatically. `.gitignore` was already unanchored for this in #3.
- [x] **Sentry removed entirely** — `instrument.server.mjs`, `app/shared/lib/monitoring/sentry.ts`, the vite plugin, the `sentryOnBuildEnd` hook, both supabase integrations, `setUser`/`clearUser`/`setCommunityContext` in the two route layouts and the logout action, the `root.tsx` capture (now `console.error`), and the `@sentry/react-router` dependency. `app/entry.server.tsx` had no real handler of its own — it was `Sentry.createSentryHandleRequest` — so the stock React Router streaming handler that was sitting commented out in the same file was restored.
- [x] **`netlify/edge-functions/`** — the umami proxy. Netlify auto-detects this directory *relative to the base*, which is the repo root, so after the move it would have silently stopped deploying. Now declared explicitly as `edge_functions = "apps/web/netlify/edge-functions"`.
- [x] **Lockfile regenerated.** The `.` importer is now empty and `apps/web` holds the dependencies. Diffing the old root importer against the new one, the *only* line that changed was the removed Sentry package — zero version drift across the other ~90 dependencies.

### ⚠ Manual step required in the Netlify UI before #5

Per `docs.netlify.com/build/configure-builds/monorepos`, config search order is **package directory → base directory → root**, and the package directory **cannot be set in `netlify.toml`** — UI only.

Set **Project configuration → Build & deploy → Continuous deployment → Build settings**:

- **Package directory:** `apps/web`
- **Base directory:** leave unset (repo root), so pnpm installs the whole workspace

Until the package directory is set, Netlify falls back to the root, finds no `netlify.toml`, and **the `/tools` and `/stats.js` redirects disappear.** That is a live-traffic regression, not a build failure, so the deploy would look green.

Every path in `netlify.toml` is relative to the **base** (the repo root), not to the file — hence `publish = "apps/web/build/client"`. This is the usual monorepo trap.

**Verified locally:** `pnpm install` resolves · `pnpm typecheck` at the same 15-error baseline · `pnpm build` exits 0 and now runs clean, since the Sentry sourcemap upload step is gone. Not verifiable locally: whether Netlify picks up `apps/web/.netlify/v1/functions/` for the SSR handler — that is what #5's deploy preview is for.

Note: `apps/web/.netlify/v1/functions/react-router-server.mjs` is generated output that is tracked in git, so it churns on every build. It was already stale (recorded plugin 2.0.1, lockfile had 2.1.3). Left tracked deliberately — gitignoring it touches deploy behaviour that cannot be tested before #5.

---

## #5 · Verify `apps/web` runs and deploys — HARD GATE

Blocked by #4. **Do not start any other app until this passes.**

- [x] `pnpm install` from the root resolves — `--frozen-lockfile` reports the lockfile up to date across both workspace projects, which is the step Netlify runs before the build command
- [x] `pnpm --filter @luhive/web dev` serves — root `pnpm dev` delegates correctly and Vite comes up on `:5173`
- [x] `pnpm --filter @luhive/web typecheck` — same 15 pre-existing errors, same files, same line numbers as before the move. That identity is the proof the `~/` alias survived; a broken alias would produce hundreds
- [x] `pnpm --filter @luhive/web build` succeeds — exits 0, and now runs clean since the Sentry sourcemap upload step is gone
- [x] Netlify **branch deploy** builds — `dev.luhive.com` is live on commit `154a57f`

### ⚠ There are TWO Netlify sites building this repo

This was not in the plan and it broke the first deploy. Both need the package directory, not just one.

| Site | URL | Prod branch | Package directory |
|---|---|---|---|
| `luhive-mvp` | luhive.com | `main` | `apps/web` |
| `luhive-development` | dev.luhive.com | `development` | `apps/web` |

The first push failed with `Build script returned non-zero exit code: 2` because only `luhive-mvp` had been updated. With no package directory, `luhive-development` never found `apps/web/netlify.toml` and fell back to its UI settings — publishing `build/client` at the repo root, which no longer exists, and losing `SECRETS_SCAN_OMIT_PATHS`, so the build tripped Netlify's secret scanner on the Supabase keys it had just emitted. Both sites are now set; base stays unset on both.

### Verified against the live branch deploy

- **New build is actually serving** — 0 Sentry mentions across all 57 entry assets. Before the fix the bundle still carried `SENTRY_RELEASE={id:"91a4b4a..."}`, which is the cleanest way to tell which commit Netlify is serving.
- **Redirects intact** — `/stats.js` 200, `/tools` 302 → `/tools/ics-generator`, which proves `netlify.toml` is being read from the package directory.
- **SSR alive** — `/` and `/c/luhive` return server-rendered HTML with data-driven titles, so `.netlify/v1/functions/` resolved correctly. That was the one thing that could not be checked locally.
- **Task #1 holds in production shape** — `/api/events/email-debug` → 404, `attenders-list` with no id → 400, with an unknown id → 404 `{"error":"Event not found"}`.

- **Auth, event page and dashboard** — verified manually in a browser against `dev.luhive.com`. Cookie-based auth could not be checked with curl.

**Gate passed.** All five items green.

Production is untouched — `luhive-mvp` builds `main`, which has none of these commits. Merging `development` → `main` is what ships it.

**Baseline for comparison:** the 15 type errors are pre-existing and unrelated to the migration — `community_waitlist` missing from the generated types (6), an unexported `DashboardStatsData`, a missing `google-auth-library`, and assorted `string | null` narrowing. They were 15 before task #1 and are 15 now. Track separately; do not let them block CI in #10.

The MVP is live for Enhance Azerbaijan, Azerbaijan Startup Community and GDG Baku. A broken deploy here is a real outage, not an inconvenience.

### What to check on the branch deploy

The three things that cannot be verified locally, in the order they would fail:

1. **The SSR handler.** `apps/web/.netlify/v1/functions/react-router-server.mjs` is generated relative to the Vite root. Netlify must find it via the package directory. If this is wrong, every page 404s or returns the bare shell.
2. **The redirects.** Hit `/tools` and `/stats.js`. If `netlify.toml` was not picked up, these break while the build still reports success.
3. **The umami edge function.** `edge_functions` is now an explicit path; confirm it deployed rather than silently vanishing.

Then the functional checks: log in, open an event page, open the dashboard.

---

## #6 · Bring in `apps/integration-api`

Blocked by #5. Source: `/Users/alistein/Documents/Luhive/LuhiveIntegrationAPI` — 458 LOC, Hono on Cloudflare Workers, has tests and 17 architecture docs.

- [x] **The source was not importable as written.** Only the 19 docs were ever committed; the Worker, its tests, config and lockfile were untracked on disk, and the repo had no remote. `git subtree` reads committed history, so the documented command would have imported the docs and none of the code. Fixed at the source: redacted the live partner key in `api.http`, ignored the generated `worker-configuration.d.ts`, and committed the rest as `45d808c` after confirming tests, typecheck and a `wrangler` dry-run all passed there first.
- [x] `git subtree add --prefix=apps/integration-api "/Users/alistein/Documents/Luhive/LuhiveIntegrationAPI" main` — local path, since there is no remote. No `--squash`; both source commits (`af77c8a`, `45d808c`) are ancestors of the import commit, verified with `git merge-base --is-ancestor`.
- [x] Ran on a **separate worktree branched from `origin/main`**. `git subtree add` refuses a dirty tree, and the main working tree had uncommitted work.
- [x] Docs: `docs/spec/` is authoritative, so the imported `docs/01`–`17` and `docs/README.md` are **deleted**. They predate the workspace and already contradict the spec — `01` still says "single writer per table", superseded by "one implementation per business rule". Only `docs/partner/public-events-api.spec.md` survives, because it is customer-facing and has no equivalent in the spec.
- [x] `wrangler.jsonc` needed **no path changes** — `main` and `$schema` are relative and the config sits beside `src/`. Verified by `wrangler deploy --dry-run` from `apps/integration-api`: 1359.92 KiB bundle, both `vars` bindings resolved.
- [x] `vitest.config.ts` is picked up: root `pnpm test` reports `Scope: 2 of 3 workspace projects` and runs all 10 tests. **`test` is now `vitest run`** — the bare `vitest` it inherited watches forever, which would hang CI in #10. `test:watch` keeps the old behaviour.
- [x] **Root passthroughs were skipping this package.** `pnpm -r --if-present typecheck|build` matched nothing, so the Stage 0 gate would have gone green without ever checking the Worker. Added `typecheck` (`tsc --noEmit`) and `build` (`wrangler deploy --dry-run --outdir dist`, so it validates the bundle without publishing).
- [x] `typecheck` runs `cf-typegen` first, and that is not incidental. `worker-configuration.d.ts` declares the Workers runtime globals the code uses — without it `src/lib/cache.ts` fails on `caches`. It is generated from `wrangler.jsonc`, so it is gitignored and rebuilt rather than committed as a 570 KB artifact.
- [x] Package renamed to `@luhive/integration-api`; adopted `catalog:` for `hono`, `zod` and `@supabase/supabase-js`. All three now resolve to one version across both apps (`zod@4.4.3`, `@supabase/supabase-js@2.108.1`, `hono@4.13.3`).
- [x] Deleted the nested `pnpm-workspace.yaml` and `pnpm-lock.yaml`, which would compete with the real root. Its `allowBuilds` carried `workerd`, so `workerd` joined `onlyBuiltDependencies` at the root — `wrangler`'s postinstall needs it.
- [x] Worker ignores folded into the root `.gitignore`, unanchored like the React Router entries: `.wrangler/`, `.dev.vars`, `dist/`, `worker-configuration.d.ts`.
- [x] `db/0001_api_keys.sql` untouched, byte-for-byte — reconciling migrations is #8.
- [x] Root `pnpm typecheck` reports the **same 15 errors as before the import**, all in `apps/web`. The Worker adds none. Baseline unchanged, so #6 did not expand into unrelated fixes.
- [ ] **Deploy still unverified.** `wrangler whoami` reports an expired token and the shell is non-interactive, so the deploy was deferred rather than done here. The dry-run proves the bundle and config resolve from the nested directory; it does not prove the credentials or the `api.luhive.com` route. `https://api.luhive.com/health` currently returns `{"status":"ok"}` from the pre-import deployment. Run `wrangler login`, then `pnpm --filter @luhive/integration-api deploy` and re-check `/health`.

Two things left deliberately alone, both outside this task's "move files, change no behaviour" line: the imported `README.md` is still the Cloudflare scaffold stub, which documents `npm run` commands that no longer apply; and `typescript` is pinned at `^7.0.2` here against `^5.9.2` in `apps/web`, so the workspace installs two compilers. Neither breaks anything today — nothing is shared between the apps yet — but both want fixing before `packages/db` makes the type boundary real. `@cloudflare/vitest-pool-workers` is also still an unused devDependency.

---

## #7 · Create `packages/db` skeleton

Blocked by #5. Empty but wired, so the schema has somewhere to land.

- [ ] `packages/db/package.json` — `@luhive/db`, private
- [ ] **Exports map**, so a Workers build cannot reach the Node client:
  - `.` → `./src/types.ts` — generated DB types, universal (types only, so it erases at build)
  - `./http` → `./src/http.ts` — supabase-js, Workers-safe
  - `./node` → `./src/node.ts` — `pg` pool, Node only

  Without this, someone imports `pg` on a shared path and it surfaces at `wrangler deploy`, not at typecheck.
- [ ] `kysely.config.ts` for `kysely-ctl` — migrations folder plus the Supabase connection string
- [ ] `codegen` script — `kysely-codegen` reads `DATABASE_URL` and writes `src/types.ts`
- [ ] Empty `migrations/`
- [ ] tsconfig extending `tsconfig.base.json`

No schema content yet.

---

## #8 · Baseline the real schema and reconcile migrations

Blocked by #7. **This is the point of Stage 0.**

7 of 15 tables have no migration anywhere — `communities`, `community_members`, `events`, `event_registrations`, `profiles`, `community_visits`, `community_waitlist`. They exist only in the Supabase dashboard, so production cannot be rebuilt and no schema change can be reviewed.

- [ ] `pg_dump --schema-only` against the live database → `packages/db/migrations/0000_baseline.sql`. Use the dump rather than an ORM introspect: it also captures the RLS policies, triggers and functions an introspect drops, and those policies still protect the MVP's browser-side queries
- [ ] Bring the 20 existing `supabase/migrations/*.sql` and integration's `db/0001_api_keys.sql` into the same lineage under `packages/db/migrations/`. Everything after the baseline is hand-written SQL
- [ ] `kysely-codegen` → `packages/db/src/types.ts`, generated from the live database and never hand-edited
- [ ] Sanity-check against `app/shared/models/database.types.ts`

Note: the `events` table is **calendar** events. The behavioural table added later is `person_event` — the collision is deliberate to avoid.

**Gate:** a fresh database built from `packages/db/migrations/` matches production, and `kysely-codegen` against that fresh database produces a `types.ts` identical to the one generated against production.

---

## #9 · Point `apps/web` at `@luhive/db` types

Blocked by #8.

- [ ] `app/shared/models/entity.types.ts` re-exports from `@luhive/db` instead of the local generated file
- [ ] Delete `app/shared/models/database.types.ts` (892 lines) and the `supabase-types` script — `kysely-codegen` in `packages/db` replaces it
- [ ] Expect typecheck to surface drift between the generated file and the real schema — those are real findings, not noise

First time both apps share one source of truth, and what makes a schema change break CI instead of production.

**Watch — this bullet may not survive contact.** `apps/web` still queries Postgres through supabase-js, and `createClient<Database>` wants Supabase's own generated `Database` shape, which is not the shape `kysely-codegen` emits. (A Drizzle schema would not have matched it either — the plan glossed this before the decision changed.) So either keep `supabase gen types` purely for typing the client and use `@luhive/db` for entity types only, or drop the generic. Decide when #9 lands; it does not block #8.

---

## #10 · CI

Blocked by #6. There is no `.github` directory in any repo today — nothing runs before a merge.

- [ ] `.github/workflows/ci.yml` on `pull_request` and pushes to `main` / `development`
- [ ] pnpm install with lockfile cache
- [ ] `pnpm -r typecheck` · `pnpm -r build` · `pnpm -r test`
- [ ] Baseline pre-existing type errors rather than blocking the pipeline; track cleanup separately

Only mechanism that will catch a `packages/db` change breaking `apps/integration-api` — a silent failure mode today, and a live one the moment both apps share a schema.

---

## Out of scope for Stage 0

- Creating `apps/core-api` — that is Stage 1
- Any change to `app/modules/events/**` beyond what the move requires
- Refactoring anything not required to make the workspace build
- Provisioning GCP — the Supabase region must be identified first, since core's region must match it
