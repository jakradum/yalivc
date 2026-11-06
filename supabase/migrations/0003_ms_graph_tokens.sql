-- Microsoft Graph refresh tokens kept server-side, one row per purpose.
-- First use: 'onedrive-backup', the delegated grant behind
-- /api/cron/onedrive-backup (src/lib/backup/graph.js), set by the consent
-- flow at /api/backup-connect. Never exported by the backup itself.
--
-- Access: nobody but the server, exactly like 0001. RLS on with no policies;
-- anon and authenticated get no privileges; only service_role (the secret key).
-- Additive only.

create table if not exists public.ms_graph_tokens (
  purpose       text primary key,
  refresh_token text not null,
  scope         text,
  updated_at    timestamptz default now()
);

alter table public.ms_graph_tokens enable row level security;

revoke all on public.ms_graph_tokens from anon, authenticated;

grant select, insert, update, delete on public.ms_graph_tokens to service_role;
