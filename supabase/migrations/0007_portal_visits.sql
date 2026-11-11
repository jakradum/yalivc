-- LP portal usage, kept in-house (agreed 11 Nov 2026). One row per visit:
-- who, when they arrived, active minutes, whether they downloaded, their rating.
--
--   * A visit starts on the first ping from the portal (src/app/(portal)/ActivityTracker.js)
--     and ends after 30 minutes with no ping; the next ping starts a new visit.
--   * active_seconds only grows while the tab is visible and the LP moved, scrolled or
--     typed in the last 5 minutes; each ping adds at most 60 seconds.
--   * downloaded / rating are set on the current visit by /api/portal-download and
--     /api/portal-feedback.
--   * is_staff rows (Yali addresses) are kept but left out of the report view.
--
-- Holds LP emails, so: server only, like 0001. RLS on with no policies; anon and
-- authenticated get nothing, including the view and the functions.

create table if not exists public.portal_visits (
  id             bigint generated always as identity primary key,
  email          text not null,
  is_staff       boolean not null default false,
  started_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  active_seconds integer not null default 0,
  downloaded     boolean not null default false,
  rating         smallint check (rating between 0 and 10)
);

create index if not exists portal_visits_email on public.portal_visits (email, last_seen_at desc);
create index if not exists portal_visits_started on public.portal_visits (started_at desc);

alter table public.portal_visits enable row level security;
revoke all on public.portal_visits from anon, authenticated;
grant select, insert, update, delete on public.portal_visits to service_role;

-- The visit an event belongs to: the email's visit seen in the last 30 minutes, or a new one.
create or replace function public.portal_visit_current(p_email text, p_is_staff boolean)
returns bigint
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('visit:' || p_email));
  select id into v_id from portal_visits
   where email = p_email and last_seen_at > now() - interval '30 minutes'
   order by last_seen_at desc limit 1;
  if v_id is null then
    insert into portal_visits (email, is_staff) values (p_email, p_is_staff) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- A heartbeat: adds up to 60 active seconds to the current visit.
create or replace function public.portal_visit_ping(p_email text, p_is_staff boolean, p_seconds integer)
returns void
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_id bigint := portal_visit_current(p_email, p_is_staff);
begin
  update portal_visits
     set active_seconds = active_seconds + greatest(0, least(coalesce(p_seconds, 0), 60)),
         last_seen_at = now()
   where id = v_id;
end;
$$;

-- A download or a rating on the current visit (null leaves a field as it is).
create or replace function public.portal_visit_mark(p_email text, p_is_staff boolean, p_downloaded boolean, p_rating integer)
returns void
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_id bigint := portal_visit_current(p_email, p_is_staff);
begin
  update portal_visits
     set downloaded = downloaded or coalesce(p_downloaded, false),
         rating = coalesce(p_rating, rating),
         last_seen_at = now()
   where id = v_id;
end;
$$;

-- What to read in the Supabase Table Editor: LP visits, newest first, times in IST.
create or replace view public.portal_visits_report
with (security_invoker = true) as
select email                                                         as lp,
       to_char(started_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI') as signed_in_ist,
       round(active_seconds / 60.0, 1)                               as minutes_on_portal,
       case when downloaded then 'yes' else 'no' end                 as downloaded_report,
       rating
  from portal_visits
 where not is_staff
 order by started_at desc;

revoke all on public.portal_visits_report from anon, authenticated;
grant select on public.portal_visits_report to service_role;

revoke all on function public.portal_visit_current(text, boolean) from public, anon, authenticated;
revoke all on function public.portal_visit_ping(text, boolean, integer) from public, anon, authenticated;
revoke all on function public.portal_visit_mark(text, boolean, boolean, integer) from public, anon, authenticated;
grant execute on function public.portal_visit_current(text, boolean) to service_role;
grant execute on function public.portal_visit_ping(text, boolean, integer) to service_role;
grant execute on function public.portal_visit_mark(text, boolean, boolean, integer) to service_role;
