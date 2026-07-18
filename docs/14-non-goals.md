# What we are deliberately NOT building yet

This is the anti-overengineering list. Each is a real future need that is wrong to build now.

- **Custom domains / full white-label multitenancy.** The data model is already tenant-scoped. Branded URLs and per-tenant SSL add real complexity and buy a URL nobody is paying for yet. The API approach delivers the actual integration without it.
- **Publishable (client-side) keys and `allowed_origins` logic.** Both consumers render server-side on a single secret key. Add publishable keys when a customer genuinely needs client-side calls.
- **A generic forms / submissions engine.** Build the specific `startups` table now. Generalize only when a second and third submission type show you the real abstraction.
- **OpenAPI generation and a published typed client.** Structure with Zod so this is cheap later (`@hono/zod-openapi`), but do not wire the tooling until an external party needs the spec.
- **Durable Objects rate limiting.** Start with WAF rules plus the rate-limit binding. Add exact distributed counters only if abuse demands it.
- **Staff-level enablement tooling in the dashboard.** For the pilot, flip `settings.features.startups` by hand in Supabase. Build a staff surface when you have more than a couple of communities to manage.
- **Heavy or background compute on Workers.** Member intelligence, churn prediction, and post-event summaries are async/batch jobs. They belong to the core backend on a server, not to this edge API. Keep this service request-response only.
