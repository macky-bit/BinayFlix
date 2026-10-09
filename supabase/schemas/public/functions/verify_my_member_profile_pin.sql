CREATE OR REPLACE FUNCTION public.verify_my_member_profile_pin (
  selected_profile_id bigint,
  selected_pin        text
)
  RETURNS TABLE (
    is_verified        boolean,
    retry_after_seconds integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  stored_pin_hash text;
  failed_attempts smallint;
  locked_until timestamp with time zone;
  checked_at timestamp with time zone := clock_timestamp();
  next_failed_attempts smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if selected_pin is null or selected_pin !~ '^[0-9]{4}$' then
    raise exception 'Profile PIN must contain exactly four digits'
      using errcode = '22023';
  end if;

  select
    profile.pin_hash,
    profile.pin_failed_attempts,
    profile.pin_locked_until
  into stored_pin_hash, failed_attempts, locked_until
  from public.member_profile as profile
  join public."user" as account
    on account.user_id = profile.user_id
  where profile.member_profile_id = selected_profile_id
    and account.auth_user_id = (select auth.uid())
    and profile.is_active
  for update of profile;

  if not found then
    raise exception 'Member profile does not exist' using errcode = 'P0002';
  end if;

  if stored_pin_hash is null then
    update public.member_profile
    set pin_failed_attempts = 0,
        pin_locked_until = null
    where member_profile_id = selected_profile_id;
    return query select true, 0;
    return;
  end if;

  if locked_until is not null and locked_until > checked_at then
    return query
      select false, greatest(1, ceil(extract(epoch from (locked_until - checked_at)))::integer);
    return;
  end if;

  if extensions.crypt(selected_pin, stored_pin_hash) = stored_pin_hash then
    update public.member_profile
    set pin_failed_attempts = 0,
        pin_locked_until = null
    where member_profile_id = selected_profile_id;
    return query select true, 0;
    return;
  end if;

  next_failed_attempts := case
    when locked_until is not null and locked_until <= checked_at then 1
    else least(failed_attempts + 1, 5)
  end;

  update public.member_profile
  set pin_failed_attempts = next_failed_attempts,
      pin_locked_until = case
        when next_failed_attempts >= 5 then checked_at + interval '15 minutes'
        else null
      end
  where member_profile_id = selected_profile_id;

  return query
    select
      false,
      case when next_failed_attempts >= 5 then 900 else 0 end;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."verify_my_member_profile_pin"(bigint, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."verify_my_member_profile_pin"(bigint, text) FROM PUBLIC;
