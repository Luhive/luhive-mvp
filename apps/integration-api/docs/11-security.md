# Security

Each item is a concrete risk and its mitigation. The first one is the one that matters most.

## Tenant isolation (highest priority)

- `community_id` is derived from the API key on every request, never read from body or query.
- Every read and write carries `.eq('community_id', ctx.communityId)`.
- `:id` mutations are scoped in the statement itself (`where id = :id and community_id = ctx.communityId`), so a guessed id from another tenant matches nothing.
- The service role bypasses RLS, so this is enforced in code. RLS stays on as a backstop.

## Cache must be tenant-aware (Workers-specific, easy to miss)

Edge caching a keyed response by URL alone would let one community receive another's cached data. When you cache reads, build the cache key from the resolved `community_id` plus the path, so cached entries never cross tenants. This sits at the intersection of [Ops](./13-ops.md) caching and tenant isolation, and it is the subtle bug to watch for on Workers.

## API key handling

- Store `sha256(secret)` only; raw key shown once, unrecoverable.
- 256-bit random secrets; constant-time comparison to avoid timing leaks.
- Revocation and expiry checked on every request.
- Least privilege via scopes; multiple active keys per community for zero-downtime rotation.
- Never log the `Authorization` header. Workers request logging must redact it.

## Secret key exposure on the marketing site

- Secret key lives only in the Next.js server environment, never a `NEXT_PUBLIC_` variable or client bundle.
- The submission flows browser → your own Next.js route handler → this API with the secret key. The browser never holds the key or calls this API directly.

## Input validation and injection

- Validate every field with Zod, including hard max lengths.
- `supabase-js` uses parameterized queries; never build SQL by string interpolation.

## Stored XSS (real, because submissions are rendered publicly)

- Store submissions as plain text and escape on output when the marketing site renders them.
- If rich text is ever allowed, sanitize server-side with an allowlist on input and still escape on output. Do both.

## Abuse on the public submission endpoint

- The approval queue is the strongest control: nothing a stranger submits is public until an admin approves it.
- Turnstile on the form, verified server-side in the Next.js route before forwarding. A honeypot field as a cheap pre-filter.
- Rate limit by IP and by key (see [Ops](./13-ops.md)).
- Deduplicate likely repeats (same website or email within a window).
- Enforce a max request body size.

## CORS

- Server-side-only consumption needs no browser origin allowed. Lock it down.
- If a publishable key is ever used client-side, allow only that community's registered origins, never `*`, and never `*` with credentials.

## Authorization for admin actions

- Approve/reject verify `owner` or `admin` role in the target community, not merely a valid token.

## Data exposure and error hygiene

- Public DTOs exclude all internal and PII fields.
- No stack traces or database errors in responses. For cross-tenant access, a generic 404 avoids confirming a resource exists elsewhere.

## Feature gating ties into keys

- A community without `settings.features.startups` never receives a key carrying `startups:*` scopes, and the API re-checks the flag as defense in depth. The feature flag is the one switch governing the dashboard tab, the key scopes, and the API.

## Privacy and retention

- Submissions collect personal data. Put a consent notice on the form linked to your privacy policy.
- Minimize stored PII; if `submitter_ip` is kept for moderation, set a retention window that purges rejected and stale submissions.
