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
- [x] **Correction, 2026-08-21.** The catalog above pins `drizzle-orm ^0.44`; the decision is now Kysely. Swap it for `kysely ^0.29` in `pnpm-workspace.yaml`. Done in #7, when `@luhive/db` became the first catalog consumer.
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

- [x] `packages/db/package.json` — `@luhive/db`, private
- [x] **Exports map**, so a Workers build cannot reach the Node client:
  - `.` → `./src/types.ts` — generated DB types, universal (types only, so it erases at build)
  - `./http` → `./src/http.ts` — supabase-js, Workers-safe
  - `./node` → `./src/node.ts` — `pg` pool, Node only

  Without this, someone imports `pg` on a shared path and it surfaces at `wrangler deploy`, not at typecheck.
- [x] `kysely.config.ts` for `kysely-ctl` — migrations folder plus the Supabase connection string
- [x] `codegen` script — `kysely-codegen` writes `src/types.ts` (#8 pointed it at `PRODUCTION_DATABASE_URL`, read-only)
- [x] Empty `migrations/`
- [x] tsconfig extending `tsconfig.base.json`

No schema content yet.

**Verified.** `pnpm list -r --depth -1` now shows four projects (root, web, integration-api, `@luhive/db`). Catalog pin is `kysely ^0.29` (resolves to `0.29.5`); `kysely-ctl` is `^0.21.0` because `0.19` rejects the 0.29 peer range. `pnpm --filter @luhive/db typecheck` is clean. `kysely --help` and `kysely-codegen --help` both print without `DATABASE_URL`. An esbuild of `.` and `./http` has no `pg` in the input graph; only `./node` imports it. Root `pnpm -r typecheck` is still the same **15 web errors**; integration-api and `@luhive/db` add none. `pnpm -r test` still passes the 10 integration tests. `pnpm --filter @luhive/web build` and the integration dry-run both succeed. `codegen` was **not** run against production — that would write schema types, which is #8.

**Deferred to #8 (first prerequisite).** `kysely-ctl`'s default `TSFileMigrationProvider` does not execute raw `.sql`. The empty `migrations/` folder and config are in place; a custom SQL provider must land before `0000_baseline.sql` can be applied.

**User, before #8.** Copy Postgres URIs from Supabase Dashboard → Connect into a local, gitignored `packages/db/.env`. #8 split this in two: `PRODUCTION_DATABASE_URL` is read-only (dump and codegen) and `VALIDATION_DATABASE_URL` is a throwaway project that migrations write to. Session pooler for both, since the network is IPv4-only. Do not commit them or paste a password into chat.

**Still open, before #9.** `apps/web` is `typescript@^5.9.2`, `apps/integration-api` is `^7.0.2`. `@luhive/db` follows web (`^5.9.2`) and is not imported by either app yet. Align the compilers before the package becomes a shared type boundary.

---

## #8 · Baseline the real schema and reconcile migrations

Blocked by #7. **This is the point of Stage 0.** First implementation step: a `kysely-ctl` migration provider that applies raw `.sql` files — the default TypeScript provider will ignore the baseline dump.

Production has **16 tables**; 9 of them were created by a migration (`announcement_views`, `api_keys`, `community_announcement_images`, `community_announcements`, `event_collaborations`, `event_reminders`, `event_visits`, `google_forms_tokens`, `sent_reminders`). The other **7 exist only in the Supabase dashboard** — `communities`, `community_members`, `community_visits`, `event_registrations`, `events`, `profiles`, `telegram_users` — so production cannot be rebuilt and no schema change can be reviewed.

- [x] `SqlFileMigrationProvider` in `packages/db/tooling/` — reads only root `*.sql` files in lexical order, runs each file as one unsplit raw query (empty parameter list, so `pg` uses the simple query protocol and function bodies survive), rejects psql meta-commands, and has no `down`
- [x] **Migrations cannot reach production.** `kysely.config.ts` resolves `VALIDATION_DATABASE_URL` only, and refuses to connect if it matches `PRODUCTION_DATABASE_URL` by string or by Supabase project ref. There is no generic `migrate` script — only `migrate:validation` and `migrate:list`
- [x] `pg_dump --schema-only` (local 17.10, production is 17.6) against production's `public` → `packages/db/migrations/0000_baseline.sql`. Dump over ORM introspect: it keeps the 53 RLS policies, 3 triggers, 5 functions and 5 enums an introspect drops, and those policies still protect the MVP's browser-side queries. Production inspection ran with `default_transaction_read_only=on`
- [x] The 19 `supabase/migrations/*.sql` (the plan said 20) and integration's `db/0001_api_keys.sql` moved byte-for-byte — git records all 20 as renames — into `packages/db/migrations/archive/web/` and `archive/integration-api/`
- [x] `kysely-codegen` → `packages/db/src/types.ts`, generated from production, never hand-edited
- [x] Compared against `app/shared/models/database.types.ts`

Note: the `events` table is **calendar** events. The behavioural table added later is `person_event` — the collision is deliberate to avoid.

**Gate:** a fresh database built from `packages/db/migrations/` matches production, and `kysely-codegen` against that fresh database produces a `types.ts` identical to the one generated against production.

### Decision: squash, then archive

`0000_baseline.sql` is the executable current state; the 20 pre-baseline files are history and never run. Replaying them was not an option — they only account for 9 of 16 tables, so replay would produce a database that does not match production, and the provider deliberately ignores `archive/` so the two can never both apply. The boundary is documented in `packages/db/migrations/README.md`.

### One production object deleted, two excluded from the dump

`pg_dump` of `public` picks up platform objects as well as ours, and two of them made the dump unusable as-is:

- **`event_published_webhook` on `public.events` — dropped from production.** A dashboard-configured Database Webhook posting every `events` insert/update/delete to a Railway bot. Its definition embedded the destination URL **and a live bearer token**, so `pg_dump` put a working credential in the dump file; it also called `supabase_functions.http_request()`, a schema that only exists where webhooks are enabled, which the validation project does not have. The endpoint is no longer used, so the trigger was dropped rather than carried: `DROP TRIGGER event_published_webhook ON public.events`. Production now has no `supabase_functions` triggers. Re-dumping afterwards produced a **byte-identical** baseline, which confirms the exclusion had been exactly equivalent to the trigger's absence. The exclusion stays in the tooling as a guard: it stops a future dashboard webhook from committing its token
- **`public.rls_auto_enable()` — excluded.** Supabase platform code backing the `ensure_rls` event trigger, present identically on both projects. Not extension-owned and living in `public`, so `pg_dump` emits it — and applying it failed with `function "rls_auto_enable" already exists`
- **Kysely's `kysely_migration` / `kysely_migration_lock` — excluded.** Bookkeeping, kept out of every dump and out of codegen so a migrated database still compares equal to production

Both exclusions run over the comparison dumps too, so parity is proven on the same footing.

### Production drift found

- **`apps/web` types are stale.** `database.types.ts` describes 14 tables; production has 16. Missing entirely: `api_keys`, `event_visits`. Missing from `event_registrations`: `registration_city`, `registration_country`, `registration_ip`, `registration_session_id`, `time_to_register_seconds`, `utm_campaign`, `utm_content`, `utm_medium`, `utm_source`, `utm_term`. Nothing exists in the web types that is absent from production. Left alone here — **closed in #9** by regenerating into `packages/db`
- **`community_waitlist` does not exist in production.** This document listed it among the un-migrated tables; the real seventh is `telegram_users`. Corrected above
- **The projects are not identically provisioned.** Production still has `pg_net 0.19.5`, installed when Database Webhooks were enabled; the validation project does not. Now that the only webhook trigger is gone, nothing in `public` depends on it. Both are PostgreSQL 17.6 and otherwise carry the same extensions
- Expected Supabase-vs-Kysely shape difference, not drift: Supabase emits `Row`/`Insert`/`Update` per table with inline enum unions; `kysely-codegen` emits one interface per table with `Generated<T>`, `Int8`, `Timestamp` and `Json` aliases. #9 had to reconcile these, not diff them — and found they disagree on more than layout, see #9

**Verified.** `migrate:validation` applied `0000_baseline` to the disposable project in one transaction. `verify:schema` (both databases dumped with identical options, normalised, bookkeeping and platform objects removed) reports **`schema: identical`**. `verify:types` reports **`generated types: identical`** — 16 tables, 5 enums. Codegen is restricted to `public.*`: without it, production's `net.*` and `supabase_functions.*` tables leak into the output and the two databases can never match. Guards proven by running them: an empty `VALIDATION_DATABASE_URL` and one equal to production both refuse to connect. `packages/db` typecheck clean, 10 unit tests pass over the provider and the dump sanitisers. `pnpm install --frozen-lockfile` is up to date, `pnpm -r test` passes 20 tests, `pnpm -r build` succeeds, and `pnpm -r typecheck` is still the same **15 web errors** — `@luhive/db` adds none.

**User, after #8.** Delete the temporary validation Supabase project. Keep `PRODUCTION_DATABASE_URL` and `VALIDATION_DATABASE_URL` in the gitignored `packages/db/.env` — the second is where future migrations get tested, so it wants a fresh disposable project each time. The dropped webhook's bearer token still authenticates against the Railway bot, so revoke it there if that service is still running.

The comparison tooling described above was retired in #9 once the baseline it validated was committed; `dump:baseline`, `verify:schema` and `verify:types` no longer exist.

---

## #9 · Point `apps/web` at `@luhive/db` types

Blocked by #8.

- [x] `app/shared/models/entity.types.ts` derives named aliases (`Event`, `Community`, enums) from `@luhive/db/supabase` — `Tables<"events">`, `Enums<"event_status">`, and so on. The aliases stay in the web app because they describe the HTTP/PostgREST row shape
- [x] The 892-line generated `app/shared/models/database.types.ts` is gone, along with the `supabase-types` script. Both generators now live in `packages/db`; the file remaining at that path is a 9-line re-export, kept as the app's import boundary
- [x] Typecheck compared against the schema — drift is recorded below

First time both apps share one source of truth, and what makes a schema change break CI instead of production.

### The `Database` generic survived contact; `Selectable` did not

The #8 note predicted `createClient<Database>` would resist `kysely-codegen`'s output, and it was right: `apps/web/app/shared/lib/supabase/server.ts` and `client.ts` need Supabase's `Row`/`Insert`/`Update` shape for `.from()` inference, and 14 server repos take `SupabaseClient<Database>`. So **both generators run**, off the same production schema, and both outputs live in `packages/db`:

- `@luhive/db` — `kysely-codegen` output (`src/db.types.ts`), for code querying over `pg`
- `@luhive/db/supabase` — `supabase gen types` output, for typing the supabase-js client

**Named entities stay in the web app.** A first pass put `Event` / `Community` aliases in `@luhive/db/entities`, derived from Kysely `Selectable<...>`. That produced **58 typecheck errors, up from 15**: Kysely's `Timestamp` is `ColumnType<Date, …>` because that is what the `pg` driver returns, while PostgREST hands back ISO strings. A package-level `Event` type is therefore a lie — it cannot be both shapes at once. The alias file was deleted. `apps/web/app/shared/models/entity.types.ts` now derives the same public names from `@luhive/db/supabase`'s `Tables` / `Enums` helpers, which match the HTTP values at runtime. Future Node consumers should take `Selectable<Events>` from `@luhive/db` directly — that is Stage 1's shape.

Resolved types at every existing call site are unchanged, so no module import moved.

### The frozen events module stayed frozen

21 of the 39 `database.types` importers are under `app/modules/events/**`, which is bug-fix-only. Rewriting those imports would have been a 21-file refactor of frozen code for no behavioural gain. Keeping `~/shared/models/database.types` as a re-export of `@luhive/db/supabase` removes the duplicated generated source — the actual goal — while leaving every importer untouched. Three files changed in `apps/web`: the two model files and `package.json`.

It also preserves the boundary the architecture rules ask for: no web file imports `@luhive/db` except through `app/shared/models/` (`entity.types.ts` and `database.types.ts`).

### Drift closed and drift remaining

Regenerating from production **closed the #8 gap**: the Supabase types now describe all **16** tables, adding `api_keys` and `event_visits` and the ten missing `event_registrations` tracking/UTM columns. That change alone introduced no errors.

Still open, and now provably unrelated to stale types: **`community_waitlist` accounts for 6 of the 15 errors** in `app/modules/community/server/create-community-action.server.ts`. #8 established the table does not exist in production, so regenerating cannot fix it — the code writes to a table that was never created. It is a genuine bug, left alone here because #9 changes types only.

**Verified.** `pnpm --filter @luhive/web typecheck` reports **exactly the same 15 errors, file for file and line for line**, as the pre-#9 baseline; `pnpm -r typecheck` is also 15, so `@luhive/db` still contributes none. `pnpm install --frozen-lockfile` clean, `pnpm -r test` passes 13 tests, `pnpm -r build` succeeds for both apps including the web prerender. Both codegens run from `PRODUCTION_DATABASE_URL`, read-only.

### Stage #8 tooling retired

The dump and parity utilities existed to produce and prove one artefact, and that artefact is now committed, so 14 files were deleted: the `pg_dump` wrapper and baseline writer, the schema/type comparison scripts, the dump sanitiser and platform-object exclusions, the diff reporter, and their three tests. `dump:baseline`, `verify:schema` and `verify:types` went with them, and `0000_baseline.sql` is marked as a fixed snapshot rather than something to regenerate.

Six files stayed, because every future schema change needs them: `SqlFileMigrationProvider`, the `VALIDATION_DATABASE_URL` guard and its project-ref parser, the codegen wrappers, and the two `bin/` entry points. The guard's behaviour is now covered by unit tests using synthetic connection strings rather than a manual run against real credentials — four cases, including a validation URL that reaches the production project through the direct connection instead of the pooler.

**User, after #9.** Nothing required. If you re-run `codegen`, both generators need `PRODUCTION_DATABASE_URL`; `supabase gen types` takes about a minute against the pooler.

---

## #10 · CI

Blocked by #6.

- [x] `.github/workflows/ci.yml` on `pull_request` and pushes to `main` / `development`
- [x] pnpm install with lockfile cache
- [x] `pnpm -r typecheck` · `pnpm -r build` · `pnpm -r test`
- [x] Baseline pre-existing type errors rather than blocking the pipeline; track cleanup separately

**Verified.** Workflow runs a frozen cached install, then `pnpm -r --if-present typecheck|build|test` (web has no `test`, `@luhive/db` has no `build`). `@luhive/web` typecheck is gated by `tsc-baseline` against the committed 15-error snapshot in `apps/web/.tsc-baseline.json`; new or stale diagnostics fail. `@luhive/db` and `@luhive/integration-api` stay zero-error. Local run: typecheck 0 new / 15 baseline, both apps build, 17 tests pass. An extra web diagnostic fails CI as intended.

Refresh the snapshot after fixing a listed error: `pnpm --filter @luhive/web typecheck:baseline`. See the unfixed 15 in #5 / #9 — they are not this task.

Only mechanism that will catch a `packages/db` change breaking a consumer — a silent failure mode today, and a live one the moment both apps share a schema.

---

## Out of scope for Stage 0

- Creating `apps/core-api` — that is Stage 1
- Any change to `app/modules/events/**` beyond what the move requires
- Refactoring anything not required to make the workspace build
- Provisioning GCP — the Supabase region must be identified first, since core's region must match it
