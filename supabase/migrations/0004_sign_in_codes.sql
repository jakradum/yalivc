-- Emailed sign-in codes for the LP portal and the data room (src/lib/sign-in/).
--
-- Rules (agreed 10 Nov 2026):
--   * A code works once and for at most 24 hours. Signing in closes every open
--     code for that email (used_at), so a later sign-in that day starts afresh.
--   * 3 wrong tries per code. Asking for a new code ("Resend") cancels the old one
--     straight away, even if its email arrives later.
--   * At most 2 unused codes per email in 24 hours (the first code and one resend),
--     so at most 6 wrong guesses. The 6th wrong guess locks the email for 24 hours.
--   * Addresses with no access get rows too (code_hash null), so the replies and
--     limits look the same whether or not the email belongs to an LP.
--
-- Nothing readable is stored: email_hash and code_hash are HMAC-SHA256 with
-- PORTAL_AUTH_SECRET. Rows older than 7 days are deleted on the next request.
--
-- Access: nobody but the server, like 0001 and 0003. RLS on with no policies;
-- anon and authenticated get no privileges and cannot call the functions.
-- Each function takes a per-email advisory lock, so two requests at the same
-- moment cannot both get a code or both spend the same try.

create table if not exists public.sign_in_codes (
  id           bigint generated always as identity primary key,
  scope        text not null check (scope in ('portal', 'dataroom')),
  email_hash   text not null,
  code_hash    text,
  issued_at    timestamptz not null default now(),
  wrong_at     timestamptz[] not null default '{}',
  used_at      timestamptz,
  replaced_at  timestamptz,
  locked_until timestamptz
);

create index if not exists sign_in_codes_email on public.sign_in_codes (scope, email_hash, issued_at desc);

alter table public.sign_in_codes enable row level security;
revoke all on public.sign_in_codes from anon, authenticated;
grant select, insert, update, delete on public.sign_in_codes to service_role;

-- Issue a new code. Returns {status: 'issued' | 'limit' | 'locked', until?, resends_left?}.
create or replace function public.sign_in_issue(p_scope text, p_email_hash text, p_code_hash text)
returns jsonb
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_locked timestamptz;
  v_unused int;
  v_first  timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext(p_scope || ':' || p_email_hash));
  delete from sign_in_codes where issued_at < now() - interval '7 days';

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
  insert into sign_in_codes (scope, email_hash, code_hash) values (p_scope, p_email_hash, p_code_hash);
  return jsonb_build_object('status', 'issued', 'resends_left', 1 - v_unused);
end;
$$;

-- Check a code against the current one. Returns
--   {status: 'ok'}                                   signed in; the code is used up
--   {status: 'wrong', tries_left, attempts_left}     tries on this code / before the lock
--   {status: 'dead'}                                 3 wrong tries; a resend is still allowed
--   {status: 'locked', until, wrong_at?}             wrong_at only on the guess that locked it
--   {status: 'expired'}                              no live code: ask for one
create or replace function public.sign_in_check(p_scope text, p_email_hash text, p_code_hash text)
returns jsonb
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_locked timestamptz;
  v_row    sign_in_codes;
  v_unused int;
  v_tries  int;
  v_wrong  timestamptz[];
begin
  perform pg_advisory_xact_lock(hashtext(p_scope || ':' || p_email_hash));

  select max(locked_until) into v_locked from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash and locked_until > now();
  if v_locked is not null then
    return jsonb_build_object('status', 'locked', 'until', v_locked);
  end if;

  select * into v_row from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash
     and used_at is null and replaced_at is null
     and issued_at > now() - interval '24 hours' and cardinality(wrong_at) < 3
   order by issued_at desc limit 1;
  if not found then
    return jsonb_build_object('status', 'expired');
  end if;

  -- A sign-in closes every open code for the email, so earlier codes and wrong
  -- tries stop counting towards the limits.
  if v_row.code_hash is not null and v_row.code_hash = p_code_hash then
    update sign_in_codes set used_at = now()
     where scope = p_scope and email_hash = p_email_hash and used_at is null;
    return jsonb_build_object('status', 'ok');
  end if;

  update sign_in_codes set wrong_at = wrong_at || now() where id = v_row.id
  returning cardinality(wrong_at) into v_tries;

  select count(*) into v_unused from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash
     and issued_at > now() - interval '24 hours' and used_at is null;

  if v_tries >= 3 and v_unused >= 2 then
    update sign_in_codes set locked_until = now() + interval '24 hours' where id = v_row.id;
    select array_agg(w order by w) into v_wrong from sign_in_codes, unnest(wrong_at) w
     where scope = p_scope and email_hash = p_email_hash
       and issued_at > now() - interval '24 hours' and used_at is null;
    return jsonb_build_object('status', 'locked', 'until', now() + interval '24 hours', 'wrong_at', to_jsonb(v_wrong));
  end if;
  if v_tries >= 3 then
    return jsonb_build_object('status', 'dead');
  end if;
  return jsonb_build_object('status', 'wrong', 'tries_left', 3 - v_tries,
    'attempts_left', (3 - v_tries) + case when v_unused < 2 then 3 else 0 end);
end;
$$;

revoke all on function public.sign_in_issue(text, text, text) from public, anon, authenticated;
revoke all on function public.sign_in_check(text, text, text) from public, anon, authenticated;
grant execute on function public.sign_in_issue(text, text, text) to service_role;
grant execute on function public.sign_in_check(text, text, text) to service_role;
