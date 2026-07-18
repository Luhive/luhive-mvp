# API contracts (v1)

All routes are prefixed `/v1`. Responses use explicit DTOs. Pagination is cursor-based with `limit` capped at 100. Errors return `{ "error": "<stable_code>" }` and an appropriate status, never internals.

| Method | Path | Auth | Scope | Purpose |
|---|---|---|---|---|
| GET | `/v1/events` | key | `events:read` | Published events for the key's community |
| GET | `/v1/startups` | key | `startups:read` | Approved startups for the community |
| POST | `/v1/startups` | key (sk) | `startups:write` | Public submission, lands as `pending` |
| GET | `/v1/startups/:id` | internal | — | Admin review detail |
| PATCH | `/v1/startups/:id` | internal | — | Approve / reject / request clarification |
| GET | `/v1/public/events` | partner key | `public_events:read` | Cross-community published events feed (see [Partner public events feed](./10-partner-public-events-feed.md)) |

## Schema as the single contract

```ts
// src/schemas/startups.ts
import { z } from 'zod';

export const StartupSubmission = z.object({
  name:         z.string().min(1).max(200),
  tagline:      z.string().max(280).optional(),
  description:  z.string().max(5000).optional(),
  website:      z.string().url().max(2048).optional(),
  founder_name: z.string().max(200).optional(),
  contact_email:z.string().email().max(320).optional(),
  category:     z.string().max(80).optional(),
});

// Public DTO: an allowlist. Internal fields (contact_email, submitter_ip,
// review_notes, reviewed_by, status internals) are never in here.
export const StartupPublic = z.object({
  id: z.string(), name: z.string(), tagline: z.string().nullable(),
  description: z.string().nullable(), website: z.string().nullable(),
  logo_url: z.string().nullable(), category: z.string().nullable(),
});
```

The max lengths are not cosmetic; they are the first line of defense against payload-bloat denial of service. Build DTOs by mapping named fields, never by returning the row.

## Versioning

Keep the `/v1` prefix. Additive changes only within a version. Anything breaking gets `/v2`. This is the discipline that lets an external consumer rely on you.
