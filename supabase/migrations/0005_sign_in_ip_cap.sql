-- Per-connection cap on sign-in codes (agreed 10 Nov 2026), on top of 0004's per-email rules:
-- at most 10 code requests an hour and 20 in 24 hours from one IP address, across every
-- email and both portals. Codes are what allow guesses (3 each), so this caps a single
-- guesser at about 60 wrong tries a day however many LP emails they try.
--
-- ip_hash is HMAC-SHA256 with PORTAL_AUTH_SECRET; the IP itself is never stored.
-- Adds a 4-argument sign_in_issue next to 0004's 3-argument one, so the site keeps
-- working while the new code deploys. Drop the old one afterwards (bottom of this file).

alter table public.sign_in_codes add column if not exists ip_hash text;
create index if not exists sign_in_codes_ip on public.sign_in_codes (ip_hash, issued_at desc);

-- Returns 0004's replies, plus {status: 'busy', until} when this connection is over the cap.
create or replace function public.sign_in_issue(p_scope text, p_email_hash text, p_code_hash text, p_ip_hash text)
returns jsonb
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_locked timestamptz;
  v_unused int;
  v_first  timestamptz;
  v_hour   int;
  v_day    int;
  v_until  timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('ip:' || p_ip_hash));
  perform pg_advisory_xact_lock(hashtext(p_scope || ':' || p_email_hash));
  delete from sign_in_codes where issued_at < now() - interval '7 days';

  select count(*) filter (where issued_at > now() - interval '1 hour'), count(*)
    into v_hour, v_day from sign_in_codes
   where ip_hash = p_ip_hash and issued_at > now() - interval '24 hours';
  if v_hour >= 10 or v_day >= 20 then
    select case when v_day >= 20 then min(issued_at) + interval '24 hours'
                else min(issued_at) filter (where issued_at > now() - interval '1 hour') + interval '1 hour' end
      into v_until from sign_in_codes
     where ip_hash = p_ip_hash and issued_at > now() - interval '24 hours';
    return jsonb_build_object('status', 'busy', 'until', v_until);
  end if;

  select max(locked_until) into v_locked from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash and locked_until > now();
  if v_locked is not null then
    return jsonb_build_object('status', 'locked', 'until', v_locked);
  end if;

  select count(*), min(issued_at) into v_unused, v_first from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash
     and issued_at > now() - interval '24 hours' and used_at is null;
  if v_unused >= 2 then
    return jsonb_build_object('status', 'limit', 'until', v_first + interval '24 hours');
  end if;

  update sign_in_codes set replaced_at = now()
   where scope = p_scope and email_hash = p_email_hash and used_at is null and replaced_at is null;
  insert into sign_in_codes (scope, email_hash, code_hash, ip_hash) values (p_scope, p_email_hash, p_code_hash, p_ip_hash);
  return jsonb_build_object('status', 'issued', 'resends_left', 1 - v_unused);
end;
$$;

revoke all on function public.sign_in_issue(text, text, text, text) from public, anon, authenticated;
grant execute on function public.sign_in_issue(text, text, text, text) to service_role;

-- Run once the new site code is live:
-- drop function if exists public.sign_in_issue(text, text, text);
