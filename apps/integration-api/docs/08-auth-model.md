# Auth model

## External (API key)

Key format `luh_<sk|pk>_<keyId>_<secret>`. Stored as `sha256(secret)` only; the raw key is shown once at creation. Verification resolves the key to a `community_id` and a scope list, checks revocation and expiry, and compares the hash in constant time. The resolved context is attached to the request; every downstream query is scoped to that community.

Scopes in v1: `events:read`, `startups:read`, `startups:write`.

The marketing site renders server-side, so a single **secret** key held in its server environment does all reads and the submission write. Publishable keys are not needed for either consumer yet (see [Non-goals](./14-non-goals.md)).

## Internal (dashboard)

Approvals must verify the actual person, not just trust the dashboard. The dashboard forwards the signed-in admin's Supabase access token. The API verifies it (`supabase.auth.getUser(token)`), then confirms that user holds `owner` or `admin` in `community_members` for the target community before allowing the mutation. No shared god-token that can act on any community.
