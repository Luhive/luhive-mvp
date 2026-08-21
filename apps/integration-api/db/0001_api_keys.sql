-- 0001_api_keys.sql
-- API keys for the Luhive Integration API.
-- Written only by this API (single-writer). Run manually in the Supabase SQL editor.
-- Community keys are scoped to one community; partner keys are cross-community
-- (null community_id), gated by the key_kind discriminator + CHECK below.

create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,   -- null for partner keys
  name         text not null,
  key_id       text not null unique,                                -- public lookup id
  key_hash     text not null,                                       -- sha256(secret), hex
  key_type     text not null check (key_type in ('publishable','secret')),
  key_kind     text not null default 'community' check (key_kind in ('community','partner')),
  scopes       text[] not null default '{}',
  allowed_origins text[] not null default '{}',                     -- only for client-side keys
  last_used_at timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  constraint api_keys_community_scope check (
    (key_kind = 'community' and community_id is not null) or
    (key_kind = 'partner'   and community_id is null)
  )
);

create index if not exists idx_api_keys_key_id    on api_keys (key_id);
create index if not exists idx_api_keys_community on api_keys (community_id);

alter table api_keys enable row level security;   -- backstop; service role bypasses it
