-- Phase 1 sync control for the Sanity twin (see 0001_sanity_twin.sql and
-- src/lib/supabase/twin.js). Additive only: new tables, one new column, seed
-- rows, and the bucket's allowed file types.
--
--   sync_types   which document types the twin sync copies. A type set to
--                enabled = false is skipped entirely: never upserted, never
--                deleted from (used when Supabase becomes that type's source).
--   parity_diffs differences found by shadow mode and the parity audit.
--   sync_lock    one row per lock name, with an expiry, so only one sync runs
--                at a time. Session advisory locks do not work here: the site
--                talks to Postgres through PostgREST, whose pooled connections
--                do not keep a session between calls. Taken and released with
--                take_sync_lock / release_sync_lock over RPC.
--
-- Access: like 0001, nobody but the server. RLS on with no policies, nothing
-- for anon/authenticated, everything for service_role.

create table if not exists public.sync_types (
  type       text primary key,
  enabled    boolean not null default true,
  note       text,
  changed_at timestamptz default now()
);

create table if not exists public.parity_diffs (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  fn            text not null,
  input_hash    text not null,
  path          text not null,
  sanity_hash   text,
  supabase_hash text,
  note          text,
  recheck_ok    boolean
);
create index if not exists parity_diffs_at_idx on public.parity_diffs (at desc);
create index if not exists parity_diffs_fn_idx on public.parity_diffs (fn);

create table if not exists public.sync_lock (
  name       text primary key,
  holder     text not null,
  taken_at   timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Per-type counts after each run: {"<type>": {"sanity": n, "supabase": n}}.
alter table public.sync_runs add column if not exists counts jsonb;

alter table public.sync_types   enable row level security;
alter table public.parity_diffs enable row level security;
alter table public.sync_lock    enable row level security;

revoke all on public.sync_types, public.parity_diffs, public.sync_lock from anon, authenticated;
revoke all on sequence public.parity_diffs_id_seq from anon, authenticated;

grant select, insert, update, delete on public.sync_types, public.parity_diffs, public.sync_lock to service_role;
grant usage, select on sequence public.parity_diffs_id_seq to service_role;

-- Take the lock `p_name` for `p_holder` for `p_ttl_seconds`. Returns true when
-- the caller now holds it: it was free, had expired, or was already held by
-- the same holder (which extends it). Returns false when someone else holds an
-- unexpired lock. The single upsert is atomic, so two callers cannot both win.
create or replace function public.take_sync_lock(p_holder text, p_ttl_seconds integer default 120, p_name text default 'twin')
returns boolean
language plpgsql
set search_path = public, pg_temp
as $$
declare
  got text;
begin
  insert into public.sync_lock as l (name, holder, taken_at, expires_at)
  values (p_name, p_holder, now(), now() + make_interval(secs => greatest(p_ttl_seconds, 1)))
  on conflict (name) do update
    set holder = excluded.holder, taken_at = excluded.taken_at, expires_at = excluded.expires_at
    where l.expires_at < now() or l.holder = excluded.holder
  returning l.holder into got;
  return got is not null and got = p_holder;
end;
$$;

-- Release the lock if `p_holder` holds it. Returns true when it was released.
create or replace function public.release_sync_lock(p_holder text, p_name text default 'twin')
returns boolean
language plpgsql
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.sync_lock where name = p_name and holder = p_holder;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.take_sync_lock(text, integer, text)  from public, anon, authenticated;
revoke all on function public.release_sync_lock(text, text)        from public, anon, authenticated;
grant execute on function public.take_sync_lock(text, integer, text) to service_role;
grant execute on function public.release_sync_lock(text, text)       to service_role;

-- One enabled row per twin type (keep in step with TWIN_TYPES in twin.js;
-- the sync also inserts a row for any twin type missing here).
insert into public.sync_types (type, enabled) values
  ('portalUser', true), ('domainPrivilege', true), ('lpDownloadConsent', true), ('lpPortalFeedback', true),
  ('lpFundSettings', true), ('lpQuarterlyReport', true), ('company', true),
  ('lpInvestment', true), ('lpCompanyQuarterUpdate', true), ('quarterlyReport', true),
  ('dataRoomDocument', true), ('dataroomFundContent', true), ('dataroomSectionVisibility', true),
  ('fund2Settings', true), ('trackRecord', true), ('investor', true),
  ('pitchSchedulerInvitation', true), ('pitchSchedulerCalendarAuth', true), ('pitchSchedulerSlotCache', true),
  ('contactSubmission', true), ('newsletterSubscriber', true), ('letterheadDocument', true),
  ('travelRequest', true)
on conflict (type) do nothing;

-- The bucket now also holds images referenced by private documents.
update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
where id = 'sanity-files';

notify pgrst, 'reload schema';
