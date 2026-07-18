# Open questions to resolve in the build tool

Answer these in Claude Code / Cursor before or during the relevant step. They are the decisions an agent will otherwise guess at, plus one standing rule to state up front.

## Standing rule to paste at the top of the agent prompt

Before anything else, give the agent this as a hard constraint, because it is the one bug that silently leaks one community's data to another:

> Every query is scoped by `community_id`, and that value comes only from the authenticated API key context (`ctx.communityId`). Never read `community_id` from the request body, path, or query string. For `:id` routes, scope the mutation itself: `where id = :id and community_id = ctx.communityId`.

**Q0. Do you confirm this rule applies to every read and write, with no exceptions?**

## Questions blocking specific steps

**Q1. Events table schema (blocks step 2).** What are the real columns and types of the events table? It was not in the schema doc, and the agent will invent column names without it. Paste the DDL or column list before asking for `GET /v1/events`.

**Q2. Dependency versions and runtime flags.** Which versions are we pinning for Hono, `@hono/zod-validator`, and the Workers runtime? Instruct the agent to check current Hono-on-Workers documentation rather than write from memory, and confirm `compatibility_flags = ["nodejs_compat"]` is set so `node:crypto` works in `api-key.ts`. This flag is the most likely first-deploy failure if the setup is stale.

**Q3. Cursor pagination shape.** Confirm one convention applied uniformly to events and startups: an opaque cursor over `(created_at, id)`, response shape `{ data, next_cursor }`, `limit` capped at 100. If you want a different shape, decide it here so the endpoints stay consistent.

## Judgment call to settle deliberately

**Q4. Tests now or later?** For the tenant-isolation boundary specifically, do you want a test written alongside the build that proves community A's key cannot read community B's data? That failure is invisible until it is a breach, so it is the one worth pinning early. The alternative (move fast on the pilot, add tests once the shape settles) is legitimate, but choose it on purpose rather than by default.

**Q5. Partner-key mechanism (blocks step 5).** Two ways to store partner keys, both valid. The `api_keys` discriminator (recommended): reuse the existing table and script with `key_kind = 'partner'`, so revocation and usage tracking come for free. The secret-list alternative: keep partner key hashes in a Wrangler secret with no DB change, but revoking means editing the secret and redeploying, and you lose per-partner metadata. Which do you want? Default to the discriminator unless you are certain you will only ever have two or three partners.
