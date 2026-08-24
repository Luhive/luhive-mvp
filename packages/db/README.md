# `@luhive/db`

Shared database schema types, clients, and SQL migrations.

## The rule

**Schema changes are hand-written SQL migrations. Codegen never changes a
database; it only updates TypeScript types to match a database.**

Do not edit:

- `migrations/0000_baseline.sql` — fixed production snapshot
- `migrations/archive/` — pre-baseline history, never executed
- `src/db.types.ts` or `src/supabase.types.ts` — generated files

## Changing the schema

1. Add the next lexical migration at the root of `migrations/`, for example
   `0001_add_event_category.sql`.
2. Write the SQL explicitly (`CREATE TABLE`, `ALTER TABLE`, `DROP COLUMN`,
   indexes, constraints, and so on). Keep one coherent change per file.
3. Put production and a disposable Supabase project in `.env`:
   `PRODUCTION_DATABASE_URL` and `VALIDATION_DATABASE_URL`.
4. Apply and inspect the migration on validation:

   ```sh
   pnpm --filter @luhive/db migrate:validation
   pnpm --filter @luhive/db migrate:list
   ```

5. Review the result, then apply the **same reviewed SQL file** to production
   through the deliberate production process. Stage 0 intentionally has no
   production migration command; never point `VALIDATION_DATABASE_URL` at it.
6. After production has the new schema, regenerate and commit both type files:

   ```sh
   pnpm --filter @luhive/db codegen
   pnpm --filter @luhive/db typecheck
   pnpm --filter @luhive/db test
   ```

For destructive changes, prefer two migrations/deploys: stop using a column or
table first, then remove it after old application versions can no longer reach
it. Never edit an already-applied migration.

## Type exports

- `@luhive/db` — Kysely/`pg` schema types (`Date` timestamps)
- `@luhive/db/supabase` — supabase-js/PostgREST types (ISO string timestamps)
- `@luhive/db/node` — Node-only Kysely client
- `@luhive/db/http` — Workers-safe Supabase client

See `migrations/README.md` for the baseline and archive boundary.
