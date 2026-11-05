-- Sanity twin: a private, server-only mirror of the sensitive Sanity documents
-- (LP, data room, pitch scheduler, contact, newsletter, letters) and the PDFs
-- they reference. Phase 1 of moving that data out of Sanity: Sanity stays the
-- editing source; src/lib/supabase/twin.js copies published documents here.
--
-- Access: nobody but the server. RLS is on with no policies, and the browser
-- roles (anon, authenticated) get no privileges at all, so only the secret key
-- (service_role) used by the site's server code can read or write.

create table if not exists public.sanity_docs (
  id                text primary key,           -- Sanity _id (published documents only)
  type              text not null,              -- Sanity _type
  rev               text,                       -- Sanity _rev, to skip unchanged docs
  sanity_updated_at timestamptz,
  doc               jsonb not null,             -- the full document as Sanity returns it
  synced_at         timestamptz not null default now()
);
create index if not exists sanity_docs_type_idx on public.sanity_docs (type);

create table if not exists public.sanity_files (
  asset_id          text primary key,           -- Sanity file asset _id (file-<sha1>-<ext>)
  storage_path      text not null,              -- object path in the private sanity-files bucket
  mime_type         text,
  size_bytes        bigint,
  original_filename text,
  sha1              text,
  synced_at         timestamptz not null default now()
);

create table if not exists public.sync_runs (
  id             bigserial primary key,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  docs_upserted  integer default 0,
  docs_deleted   integer default 0,
  files_uploaded integer default 0,
  error          text
);

alter table public.sanity_docs  enable row level security;
alter table public.sanity_files enable row level security;
alter table public.sync_runs    enable row level security;

revoke all on public.sanity_docs, public.sanity_files, public.sync_runs from anon, authenticated;
revoke all on sequence public.sync_runs_id_seq from anon, authenticated;

grant select, insert, update, delete on public.sanity_docs, public.sanity_files, public.sync_runs to service_role;
grant usage, select on sequence public.sync_runs_id_seq to service_role;

-- Private bucket for the PDFs. Not public: files are served only through
-- short-lived signed URLs created server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sanity-files', 'sanity-files', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false;
