# The Cloudflare platform doing security work for you

These replace infrastructure you would otherwise run yourself:

- **WAF / rate-limiting rules (zone level, no code):** crude per-IP abuse limits on the submission path. First line, free, instant.
- **Turnstile:** bot protection on the submission form, verified in your Next.js route.
- **Cache:** short-TTL caching of public read endpoints at the edge (tenant-aware key, see [Security](./11-security.md)).
- **Bot Fight / managed rules:** baseline protection against scrapers and bad actors.

The lean posture for the pilot: lean on the approval queue plus WAF rate-limiting rules plus Turnstile. Add in-code per-key rate limiting (see [Ops](./13-ops.md)) only when a real abuse pattern shows up.
