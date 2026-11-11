-- Sign-in fixes after the 11 Nov audit (replaces 0004's sign_in_check, adds sign_in_void).
--
-- 1. The 24-hour lock now needs 6 wrong tries in total. Before, an LP who pressed Resend
--    before typing anything was locked after 3 wrong tries on the second code. Now that
--    second code just stops working, and the LP waits for the 24 hours to roll over
--    (no lock, no lockout email).
-- 2. Replies carry `resend` (can the LP still get a new code?) and `lock_left` (wrong
--    tries left before the lock), so the page can say exactly what happens next.
--    `attempts_left` stays for the old page code during the deploy.
-- 3. sign_in_void(scope, email_hash, code_hash) removes a code whose email failed to
--    send, so a Resend outage does not use up the LP's codes for the day.

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
  v_total  int;
  v_first  timestamptz;
  v_wrong  timestamptz[];
  v_resend boolean;
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

  select count(*), coalesce(sum(cardinality(wrong_at)), 0), min(issued_at)
    into v_unused, v_total, v_first from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash
     and issued_at > now() - interval '24 hours' and used_at is null;
  v_resend := v_unused < 2;

  if v_total >= 6 then
    update sign_in_codes set locked_until = now() + interval '24 hours' where id = v_row.id;
    select array_agg(w order by w) into v_wrong from sign_in_codes, unnest(wrong_at) w
     where scope = p_scope and email_hash = p_email_hash
       and issued_at > now() - interval '24 hours' and used_at is null;
    return jsonb_build_object('status', 'locked', 'until', now() + interval '24 hours', 'wrong_at', to_jsonb(v_wrong));
  end if;
  if v_tries >= 3 then
    return jsonb_build_object('status', 'dead', 'resend', v_resend,
      'until', case when v_resend then null else v_first + interval '24 hours' end);
  end if;
  return jsonb_build_object('status', 'wrong', 'tries_left', 3 - v_tries, 'lock_left', 6 - v_total,
    'resend', v_resend,
    'attempts_left', case when v_resend then (3 - v_tries) + 3 else least(3 - v_tries, 6 - v_total) end);
end;
$$;

-- Remove a code whose email could not be sent. Only an unused, unguessed code issued
-- in the last few minutes can be removed, and only by its own hash.
create or replace function public.sign_in_void(p_scope text, p_email_hash text, p_code_hash text)
returns void
language sql
set search_path = public, pg_catalog
as $$
  delete from sign_in_codes
   where scope = p_scope and email_hash = p_email_hash and code_hash = p_code_hash
     and used_at is null and cardinality(wrong_at) = 0 and issued_at > now() - interval '5 minutes';
$$;

revoke all on function public.sign_in_check(text, text, text) from public, anon, authenticated;
revoke all on function public.sign_in_void(text, text, text) from public, anon, authenticated;
grant execute on function public.sign_in_check(text, text, text) to service_role;
grant execute on function public.sign_in_void(text, text, text) to service_role;
