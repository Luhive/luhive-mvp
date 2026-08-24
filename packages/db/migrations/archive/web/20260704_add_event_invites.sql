alter table event_registrations
  add column if not exists invited_by_user_id uuid references profiles(id),
  add column if not exists registration_type text not null default 'self'
    check (registration_type in ('self', 'invited'));

create index if not exists event_registrations_invited_by_idx
  on event_registrations(invited_by_user_id);
