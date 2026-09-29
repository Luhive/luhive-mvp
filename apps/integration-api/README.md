# `@luhive/integration-api`

Public customer API (Hono on Cloudflare Workers).

## Local development

`wrangler.jsonc` points at **production**. Local runs must not use it, so
`wrangler dev` reads `.dev.vars` (gitignored), which overrides those values:

```sh
cp .dev.vars.example .dev.vars   # then fill it in
pnpm dev                         # http://localhost:8787
```

Point `.dev.vars` at the disposable validation project, the same one as
`VALIDATION_DATABASE_URL` in `packages/db/.env`:

- `SUPABASE_URL` is `https://<validation-project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` is that project's service-role key (dashboard, or
  `supabase projects api-keys --project-ref <ref>`)
- `ENVIRONMENT=development`

`pnpm create-key` reads `.dev.vars` too, so keys you mint locally exist only in
the validation project and only work against the local Worker.

```sh
pnpm create-key --kind partner --name "local partner"
pnpm create-key --kind community --name "local payments" \
  --community <community-uuid> --scopes payments:confirm
```

Requests are in `api.http` (switch `@baseUrl` to `http://localhost:8787`).

## Tests and checks

```sh
pnpm test        # vitest, no network or database needed
pnpm typecheck   # regenerates worker types, then tsc
pnpm build       # wrangler dry-run bundle
```

## Deploy

```sh
pnpm run deploy   # `pnpm deploy` is a different, built-in pnpm command
```

Secrets are set with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`.
