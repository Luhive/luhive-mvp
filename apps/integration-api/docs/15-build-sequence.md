# Build sequence

1. **Foundation.** `api_keys` table, key generation/verification, auth middleware, Worker skeleton with `/health` and `/v1/whoami`. (Already drafted; adapt config to bindings.)
2. **`GET /v1/events`.** Serves the new community. Needs the events table schema. Public DTO, cursor pagination, short-TTL tenant-aware cache.
3. **Startups reads + submission.** `startups` table, `GET /v1/startups`, `POST /v1/startups` with Zod validation and Turnstile verification on the site side.
4. **Approval.** Internal JWT auth, `GET`/`PATCH /v1/startups/:id`, dashboard review screen wired to the API, audit log.
5. **Partner public events feed.** Reuses the events read + DTO from step 2. Adds the `key_kind` discriminator and CHECK, the partner middleware under `/v1/public/*`, the `luh_pt_` key kind in the script, and shared-cache. Build after step 2, since it shares that query layer.
6. **Hardening.** Per-key rate limiting if needed, monitoring and alerts, key rotation flow, retention job, a pass against the [pre-launch checklist](./16-pre-launch-checklist.md).
