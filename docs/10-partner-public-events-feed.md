# Partner public events feed (`/v1/public/events`)

A cross-community, read-only events feed shared with integration partners. This is the mirror image of every other endpoint: it is deliberately not scoped to one community. Because of that inversion, it lives on a separate path with its own middleware, and it must never share a handler or a router with the community-scoped `/v1/events`. Keep them structurally apart so keyed private data cannot leak into the public feed.

## Access: a partner key, generated and sent manually

Not truly public. Reuses the `api_keys` table and machinery via the `key_kind = 'partner'` discriminator (see [Data model](./07-data-model.md)). A partner key has a null `community_id`, carries the `public_events:read` scope, and uses a distinct raw prefix `luh_pt_` so it is obvious in logs. Generate it with the `create-key.ts` script (partner mode, no community id), send it to the partner, revoke by setting `revoked_at`. No redeploy.

Two middlewares, never one:

- The existing community middleware asserts `key_kind = 'community'` and a non-null `community_id`, else 401.
- A new partner middleware, mounted only under `/v1/public/*`, asserts the `public_events:read` scope and never reads `community_id` at all.

A partner key physically cannot pass the community middleware, and a community key cannot pass the partner one. `verifyApiKey` returns `keyKind` and a nullable `communityId`; the two guards enforce the split. The null community is safe precisely because it can never reach a scoped query.

## Visibility: published only

For now the feed returns events with `status = 'published'` and nothing else. That is the visibility signal. Draft events never appear. Per-community and per-event opt-out is a deliberate future addition, not needed now because all published events are considered shareable at this stage.

## Filters (bounded, indexed only)

- `when`: `upcoming` | `past` | `all`, default `upcoming`.
- `from` / `to`: ISO date range.
- `q`: optional free-text match on title.
- Cursor pagination, `limit` capped at 100.

No community or category filter (events are not categorized yet, and cross-community is the whole point of the feed).

## DTO (lean, cross-community)

Because it spans communities, the DTO includes which community owns each event, but nothing member-related.

```ts
// src/schemas/events.ts
export const PublicEvent = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  location: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  url: z.string(),                    // public event page
  community: z.object({ name: z.string(), slug: z.string() }),
});
```

Never include registration counts, attendee or member data, or contact fields.

## Caching (simpler than the scoped endpoints)

The response is identical for every partner, so unlike the community endpoints there is no tenant-aware cache key. Cache by path plus normalized filters, shared across all partners, with a longer TTL (a few minutes is fine). Verify the partner key before serving, so the key gates access without fragmenting the cache: one cached copy serves everyone. This, plus a WAF per-IP rule, covers abuse without per-key rate limiting for the pilot.
