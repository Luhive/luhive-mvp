# Scope and principles

## Scope (the entire v1 surface)

What this service does:

- Serve published events.
- Serve approved startups.
- Accept public startup submissions into a moderation queue.
- Let the Luhive dashboard approve or reject them.

That is the whole v1 surface. Where something can wait, the plan says so — see [Non-goals](./14-non-goals.md).

## Four principles

1. **Single writer per table.** Events are written only by the core dashboard. Startups are written only by this API (including approvals). Two services never write the same table. This is what makes sharing one database safe.
2. **Tenant scoping lives in code.** The service role bypasses RLS, so every query is explicitly scoped by `community_id`, and that id always comes from the caller's API key, never from the request.
3. **One contract per endpoint.** A Zod schema validates input, types the handler, and shapes the output DTO. Raw database rows never leave the service.
4. **Lean now, open later.** Build for the two real consumers. Keep the code portable and the seams clean so the platform can grow without a rewrite, but do not build the growth today.
