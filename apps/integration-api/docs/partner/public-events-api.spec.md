# Luhive Public Events API — Partner Integration Spec

Version: `v1` · Last updated: 2026-07-19

This document is everything needed to integrate the Luhive **public events feed**: a read-only, cross-community feed of published events. Hand it to your engineer or coding agent as the single source of truth.

---

## 1. Overview

- **Base URL:** `https://api.luhive.com`
- **Protocol:** HTTPS only, JSON responses (`Content-Type: application/json; charset=utf-8`).
- **Method:** `GET` only. The feed is read-only; there are no write operations.
- **The one endpoint:** `GET /v1/public/events`
- **Connectivity check:** `GET /v1/whoami`

The feed returns events across all Luhive communities that are (a) **published** and (b) belong to a publicly visible community. It never exposes drafts, attendee/registration data, contact details, or internal fields.

---

## 2. Authentication

Every request must include your **partner API key** in the `Authorization` header.

```http
Authorization: Bearer luh_pt_xxxxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- The `Bearer ` prefix is recommended but optional — sending the raw key value also works.
- The key is a secret. Store it server-side (environment variable / secret manager). **Never** ship it in a browser bundle, mobile app, or public repo.
- Keys can be revoked; if a key stops working, contact Luhive for a new one.
- There is no OAuth, no token refresh, no expiry handshake — it is a single long-lived key.

### Verify your key

```bash
curl -s https://api.luhive.com/v1/whoami \
  -H "Authorization: Bearer luh_pt_your_key_here"
```

```json
{
  "ok": true,
  "data": {
    "key_id": "1008022074f9e4def4192d23",
    "key_kind": "partner",
    "community_id": null,
    "scopes": ["public_events:read"]
  }
}
```

A valid partner key has `"key_kind": "partner"`, `"community_id": null`, and includes the `"public_events:read"` scope.

---

## 3. Endpoint: `GET /v1/public/events`

Returns a page of published events, newest-relevant first, with an opaque cursor for the next page.

### Query parameters

| Param | Type | Required | Default | Constraints / notes |
|---|---|---|---|---|
| `when` | string enum | no | `upcoming` | One of `upcoming`, `past`, `all`. See ordering below. |
| `from` | date (`YYYY-MM-DD`) | no | — | Lower bound on event start. See date semantics. |
| `to` | date (`YYYY-MM-DD`) | no | — | Upper bound on event start. Must be `>= from` or you get `400`. See date semantics. |
| `q` | string | no | — | Case-insensitive substring match on the event **title**. Length 1–100. |
| `limit` | integer | no | `20` | Page size, `1`–`100`. Values outside the range (or non-numeric) return `400`. |
| `cursor` | string (opaque) | no | — | Pass the `meta.next_cursor` from the previous page. Treat as opaque (see pagination). An invalid cursor returns `400`. |

Unknown/extra query params are ignored. An invalid value for a known param (e.g. `when=foo`, `limit=999`) returns `400 invalid_query`.

### `when` and ordering

| `when` | Includes | Sort order |
|---|---|---|
| `upcoming` (default) | Events starting now or later | `starts_at` ascending (soonest first) |
| `past` | Events that already started | `starts_at` descending (most recent first) |
| `all` | All published events | `starts_at` ascending |

Ties on `starts_at` are broken by a stable internal id, so ordering is deterministic and safe for pagination.

`when` combines with `from`/`to`/`q` using AND. For example `when=upcoming&q=demo` returns upcoming events whose title contains "demo".

### What is included / excluded

Included: published events from publicly visible communities only.

Never included: draft/unpublished events, events from hidden communities, registration counts, attendee or member data, organizer contact info, online meeting links, or any internal identifiers beyond the opaque event `id`.

---

## 4. Response envelope

Every response — success or error — uses the same envelope, discriminated by the boolean `ok`. **Branch on `ok` first**, then on `error.code` for failures. Do not parse human-readable messages.

### Success

```jsonc
{
  "ok": true,
  "data": [ /* array of Event objects (see section 5) */ ],
  "meta": { "next_cursor": "eyJ..." }   // string, or null on the last page
}
```

### Failure

```jsonc
{
  "ok": false,
  "error": {
    "code": "invalid_query",            // stable machine-readable code
    "fields": [                          // present only for validation errors
      { "path": "when", "message": "Invalid option" }
    ]
  }
}
```

---

## 5. Event object

Each element of `data` has exactly these fields:

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | string | no | Opaque, stable event identifier. |
| `title` | string | no | Event title. |
| `description` | string | yes | Free text; may contain line breaks. Treat as **plain text** and escape on render (see security note). |
| `starts_at` | string | no | Event start, ISO 8601 in **UTC**. See section 6. |
| `ends_at` | string | yes | Event end, ISO 8601 in UTC, or `null` if open-ended. |
| `location` | string | yes | Physical venue name, or the literal `"Online"` for online-only events, or `null` if unspecified. |
| `cover_image_url` | string | yes | Absolute URL to a cover image, or `null`. |
| `url` | string | no | Canonical public event page, e.g. `https://luhive.com/c/<community-slug>/<event-slug>`. Link here rather than reconstructing URLs. |
| `community` | object | no | `{ "name": string, "slug": string }` — the owning community. |

Do not assume any field beyond this list exists; additional fields may be added in the future (see versioning), so ignore unknown fields rather than failing.

### Example event

```json
{
  "id": "b3f1c2a4-...",
  "title": "Innovation Wednesdays - 12th Edition",
  "description": "Join us for the special edition...",
  "starts_at": "2026-07-22T15:30:00+00:00",
  "ends_at": "2026-07-22T19:00:00+00:00",
  "location": "Fuzzy Coffee and Wine",
  "cover_image_url": "https://cdn.luhive.com/covers/iw12.jpg",
  "url": "https://luhive.com/c/innovation-wednesdays/innovation-wednesdays-12th-edition",
  "community": { "name": "Innovation Wednesdays", "slug": "innovation-wednesdays" }
}
```

---

## 6. Date & time handling (read carefully)

This is the most common source of integration bugs, so it is spelled out fully.

1. **All timestamps are UTC.** `starts_at` and `ends_at` are ISO 8601 with a zero UTC offset. The exact rendering may be `...Z` or `...+00:00`, and may or may not include fractional seconds (e.g. `2026-07-22T15:30:00+00:00` or `2026-07-22T15:30:00.000Z`). **Parse with a standards-compliant ISO 8601 parser** (`new Date(...)`, `Temporal.Instant.from(...)`, Python `datetime.fromisoformat`, etc.). Do not substring or regex the string.

2. **They represent an absolute instant**, not a wall-clock time. To display the event in a specific timezone, convert at render time (see below).

3. **The event's own local timezone is not included** in this version. The API gives you the absolute UTC instant only. If you need to show the event in its original local timezone, choose a display timezone explicitly on your side (e.g. the venue city or the viewer's timezone). Do not assume the times are already localized.

4. **`from` / `to` filters are date-only (`YYYY-MM-DD`) and compared at `00:00:00Z`.**
   - `from=2026-07-01` → events with `starts_at >= 2026-07-01T00:00:00Z`.
   - `to=2026-07-31` → events with `starts_at <= 2026-07-31T00:00:00Z`. **This excludes events later on July 31.** To include a whole day, pass the **next** day as `to` (e.g. `to=2026-08-01`).

### Converting to a display timezone (JavaScript)

```ts
function formatInZone(isoUtc: string, timeZone: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,                 // e.g. "Asia/Baku", "Europe/London", or the viewer's tz
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoUtc));
}

// formatInZone("2026-07-22T15:30:00+00:00", "Asia/Baku") -> "Jul 22, 2026, 7:30 PM"
```

### Converting (Python)

```python
from datetime import datetime
from zoneinfo import ZoneInfo

dt_utc = datetime.fromisoformat("2026-07-22T15:30:00+00:00")
local = dt_utc.astimezone(ZoneInfo("Asia/Baku"))
```

---

## 7. Pagination (cursor-based)

The feed uses **cursor (keyset) pagination**, not page numbers. There is no total count and no random page access — you walk forward one page at a time.

Rules:

- Each response includes `meta.next_cursor`.
- If `next_cursor` is a **string**, there is another page: repeat the request with `cursor=<that value>` and **all other query params unchanged**.
- If `next_cursor` is **`null`**, you have reached the end.
- The cursor is **opaque**: do not decode, parse, construct, or persist assumptions about it. It is only valid for the same query with the same filters.
- Cursors are only meaningful within the same `when`/`from`/`to`/`q`/`limit` combination. Changing a filter invalidates the cursor — start a fresh scan.

### Pagination loop (TypeScript)

```ts
async function* fetchAllEvents(params: Record<string, string>, apiKey: string) {
  let cursor: string | null = null;
  do {
    const qs = new URLSearchParams(params);
    if (cursor) qs.set("cursor", cursor);

    const res = await fetch(`https://api.luhive.com/v1/public/events?${qs}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.json();

    if (!body.ok) {
      throw new Error(`Luhive API error ${res.status}: ${body.error.code}`);
    }

    for (const event of body.data) yield event;
    cursor = body.meta?.next_cursor ?? null;
  } while (cursor !== null);
}

// for await (const event of fetchAllEvents({ when: "all", limit: "50" }, KEY)) { ... }
```

---

## 8. Errors

Failures return the envelope with `ok: false`. Branch on `error.code` (stable), not on HTTP status alone.

| HTTP | `error.code` | Meaning | What to do |
|---|---|---|---|
| 400 | `invalid_query` | A query param or cursor is invalid. `error.fields[]` lists offending paths. | Fix the request; do not retry unchanged. |
| 401 | `unauthorized` | Missing, malformed, revoked, or expired key. | Check the `Authorization` header / key. |
| 403 | `forbidden` | The key is not a partner key. | Use the partner key issued to you. |
| 403 | `insufficient_scope` | Key lacks `public_events:read`. | Contact Luhive. |
| 404 | `not_found` | Unknown route/path. | Check the URL/path. |
| 500 | `internal_error` | Server-side error. | Retry with backoff; if persistent, contact Luhive. |

Retry guidance: retry only `500` (and network/timeouts) with exponential backoff + jitter. Never auto-retry `400`/`401`/`403` without changing the request.

Example validation error (`when=foo`):

```json
{ "ok": false, "error": { "code": "invalid_query", "fields": [ { "path": "when", "message": "Invalid enum value" } ] } }
```

---

## 9. Caching, freshness & fair use

- Responses are cached at the edge for a short period (about 5 minutes) and include a `Cache-Control` header. A newly published event may take up to ~5 minutes to appear. Design for eventual consistency; do not expect real-time.
- The response is identical for all partners for a given set of query params, so you may also cache on your side keyed by the query string.
- There is currently no strict per-key rate limit, but abusive traffic is throttled at the network layer. Be a good citizen: cache, paginate with a reasonable `limit` (e.g. 50), and avoid tight polling. Polling every few minutes is plenty given the cache window.

---

## 10. Security & rendering notes

- `title`, `description`, and `location` are user-submitted text. Store and render them as **plain text and escape on output** to prevent XSS. Do not render as raw HTML.
- Always link users to the provided `url` for the canonical event page.
- Keep your partner key server-side only.

---

## 11. Versioning & stability

- The path is versioned: `/v1`. Within `v1`, changes are **additive only** — new optional fields or params may appear, but existing fields will not be removed or repurposed.
- Therefore: **ignore unknown fields** and do not treat their presence as an error.
- Any breaking change ships under a new version (`/v2`) with advance notice.

---

## 12. Quick reference

```bash
# Upcoming events (default), page size 50
curl -s "https://api.luhive.com/v1/public/events?when=upcoming&limit=50" \
  -H "Authorization: Bearer luh_pt_your_key"

# All events in a date window (note: to is exclusive at midnight UTC)
curl -s "https://api.luhive.com/v1/public/events?when=all&from=2026-07-01&to=2026-08-01" \
  -H "Authorization: Bearer luh_pt_your_key"

# Text search in title
curl -s "https://api.luhive.com/v1/public/events?q=startup" \
  -H "Authorization: Bearer luh_pt_your_key"

# Next page
curl -s "https://api.luhive.com/v1/public/events?when=upcoming&cursor=PASTE_next_cursor" \
  -H "Authorization: Bearer luh_pt_your_key"
```

### Implementer checklist

- [ ] Key stored server-side; sent as `Authorization: Bearer <key>`.
- [ ] Branch on `ok`; read data from `data`, errors from `error.code`.
- [ ] Parse `starts_at`/`ends_at` as UTC ISO 8601 with a real parser; convert to a chosen display timezone.
- [ ] Paginate by following `meta.next_cursor` until it is `null`; keep filters constant; treat the cursor as opaque.
- [ ] Remember `to` is exclusive at midnight UTC — add a day to include a full date.
- [ ] Handle `location === "Online"` and `null` cases.
- [ ] Ignore unknown fields; escape text fields on render.
- [ ] Retry only `500`/network errors with backoff; cache for a few minutes.
