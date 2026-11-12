-- Leave that hasn't finished yet, for the Monday "On leave this week" email
-- (agreed 12 Nov 2026). The leave form still saves every request to Firebase
-- (yali-leave), which stays the record of balances and history; this table is
-- only a short-lived copy the server can read, since the site has no Firebase
-- server credentials.
--
--   * /api/team-leave-notify adds a row for every leave request (not WFH or
--     weekend logs), pending or auto-approved, keyed by the Firestore doc id.
--   * /api/team-leave-status marks a row approved, or deletes it when rejected,
--     after Sunil decides on the leave dashboard.
--   * /api/cron/leave-digest reads the week's rows every Monday, emails the team,
--     then deletes every row whose last day falls on or before that Sunday.
--     Rows for leave further ahead stay until their week has been sent.
--
-- Holds who is on leave when, so: server only, like 0001. RLS on with no
-- policies; anon and authenticated get nothing.

create table if not exists public.leave_upcoming (
  request_id text primary key,           -- Firestore leaveRequests doc id
  name       text not null,              -- directory name (src/lib/leaveEmail/directory.js)
  from_date  date not null,
  to_date    date not null check (to_date >= from_date),
  type       text not null check (type in ('paid', 'medical')),
  status     text not null check (status in ('pending', 'auto-approved', 'approved')),
  days       integer,
  created_at timestamptz not null default now()
);

create index if not exists leave_upcoming_dates on public.leave_upcoming (from_date, to_date);

alter table public.leave_upcoming enable row level security;
revoke all on public.leave_upcoming from anon, authenticated;
grant select, insert, update, delete on public.leave_upcoming to service_role;
