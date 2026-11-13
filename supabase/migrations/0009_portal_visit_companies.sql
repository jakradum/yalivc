-- Which company pages an LP opened on each visit (agreed 13 Nov 2026). Adds a list of
-- company slugs to portal_visits; each slug appears once per visit.
--
--   * Set by /api/portal-activity when the portal shows /company/<slug>
--     (src/app/(portal)/ActivityTracker.js).
--   * Read on team.yali.vc/portal-usage, and as a column of portal_visits_report.
--
-- Same rules as 0007: server only, anon and authenticated get nothing.

alter table public.portal_visits add column if not exists companies text[] not null default '{}';

-- A company page view on the current visit (portal_visit_current from 0007).
create or replace function public.portal_visit_view(p_email text, p_is_staff boolean, p_company text)
returns void
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_id bigint := portal_visit_current(p_email, p_is_staff);
begin
  update portal_visits
     set companies = case when p_company = any(companies) then companies else array_append(companies, p_company) end,
         last_seen_at = now()
   where id = v_id;
end;
$$;

revoke all on function public.portal_visit_view(text, boolean, text) from public, anon, authenticated;
grant execute on function public.portal_visit_view(text, boolean, text) to service_role;

-- The report view from 0007, plus the companies opened.
create or replace view public.portal_visits_report
with (security_invoker = true) as
select email                                                         as lp,
       to_char(started_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH24:MI') as signed_in_ist,
       round(active_seconds / 60.0, 1)                               as minutes_on_portal,
       case when downloaded then 'yes' else 'no' end                 as downloaded_report,
       rating,
       array_to_string(companies, ', ')                              as companies_viewed
  from portal_visits
 where not is_staff
 order by started_at desc;

revoke all on public.portal_visits_report from anon, authenticated;
grant select on public.portal_visits_report to service_role;
