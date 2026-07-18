# Data model

## `api_keys`

```sql
create table if not exists api_keys (
  id              uuid primary key default gen_random_uuid(),
  community_id    uuid not null references communities(id) on delete cascade,
  name            text not null,
  key_id          text not null unique,          -- public lookup id
  key_hash        text not null,                 -- sha256(secret), hex
  key_type        text not null check (key_type in ('publishable','secret')),
  scopes          text[] not null default '{}',
  allowed_origins text[] not null default '{}',  -- only for client-side keys
  last_used_at    timestamptz,
  expires_at      timestamptz,
  revoked_at      timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index if not exists idx_api_keys_key_id    on api_keys (key_id);
create index if not exists idx_api_keys_community on api_keys (community_id);
alter table api_keys enable row level security;   -- backstop; service role bypasses it
```

### Partner-key amendment (for the public events feed)

See [Partner public events feed](./10-partner-public-events-feed.md). Partner keys are cross-community, so they must have a null `community_id`. A discriminator column plus a CHECK makes the two key kinds structurally incompatible: a community key always has a community, a partner key never does. This is what makes the null-community case safe.

```sql
alter table api_keys alter column community_id drop not null;
alter table api_keys add column key_kind text not null default 'community'
  check (key_kind in ('community','partner'));
alter table api_keys add constraint api_keys_community_scope check (
  (key_kind = 'community' and community_id is not null) or
  (key_kind = 'partner'   and community_id is null)
);
```

## `startups`

```sql
create table if not exists startups (
  id                uuid primary key default gen_random_uuid(),
  community_id      uuid not null references communities(id) on delete cascade,
  name              text not null,
  tagline           text,
  description       text,
  website           text,
  logo_url          text,
  founder_name      text,
  contact_email     text,
  category          text,
  metadata          jsonb not null default '{}',
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected','more_clarification')),
  submission_source text default 'public_form',
  submitter_ip      inet,
  review_notes      text,
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_startups_community_status  on startups (community_id, status);
create index if not exists idx_startups_community_created on startups (community_id, created_at desc);
alter table startups enable row level security;   -- backstop
```

The status set deliberately mirrors `demo_requests` so the dashboard review screen reuses a pattern you already have.
