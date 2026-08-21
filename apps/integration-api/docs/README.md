# Luhive Integration API — Documentation

A standalone, edge-deployed API that exposes Luhive data to community sites, built on **Hono + Cloudflare Workers**, **TypeScript**, **Zod**, and **Supabase** (service role, over HTTP).

First two consumers: a new community that wants events, and the Azerbaijan Startup Community that wants events plus startup submissions and listings. The marketing sites are Luhive-owned.

These notes are the ingested, section-by-section form of the original build plan. Read them in order for a full pass, or jump to a topic.

## Contents

| # | Note | What it covers |
|---|---|---|
| 01 | [Scope and principles](./01-scope-and-principles.md) | v1 surface and the four guiding principles |
| 02 | [Architecture and the Workers model](./02-architecture-and-workers-model.md) | Caller classes, edge runtime consequences, DB access |
| 03 | [Installation and setup](./03-installation-and-setup.md) | Scaffold, dependencies, secrets, scripts, sanity path |
| 04 | [Project structure](./04-project-structure.md) | Directory layout and framework-agnostic `lib/` |
| 05 | [Coding conventions](./05-coding-conventions.md) | The four ground rules that keep the repo lean |
| 06 | [Runtime, config, and bindings](./06-runtime-config-and-bindings.md) | `wrangler.toml`, env typing/validation, Supabase factory |
| 07 | [Data model](./07-data-model.md) | `api_keys` and `startups` tables |
| 08 | [Auth model](./08-auth-model.md) | External API keys and internal dashboard JWTs |
| 09 | [API contracts (v1)](./09-api-contracts.md) | Endpoint table, schema-as-contract, versioning |
| 10 | [Partner public events feed](./10-partner-public-events-feed.md) | Cross-community `/v1/public/events` |
| 11 | [Security](./11-security.md) | Per-risk mitigations, tenant isolation first |
| 12 | [Cloudflare platform security](./12-cloudflare-platform-security.md) | WAF, Turnstile, cache, managed rules |
| 13 | [Ops](./13-ops.md) | Rate limiting, caching, secrets, deploy, observability |
| 14 | [Non-goals](./14-non-goals.md) | What we deliberately do NOT build yet |
| 15 | [Build sequence](./15-build-sequence.md) | The ordered delivery steps |
| 16 | [Pre-launch checklist](./16-pre-launch-checklist.md) | Final go/no-go checks |
| 17 | [Open questions](./17-open-questions.md) | Decisions to resolve in the build tool |
