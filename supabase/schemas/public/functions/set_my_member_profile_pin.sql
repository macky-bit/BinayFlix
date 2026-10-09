CREATE OR REPLACE FUNCTION public.set_my_member_profile_pin (
  selected_profile_id bigint,
  selected_pin        text   DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if selected_pin is not null and selected_pin !~ '^[0-9]{4}$' then
    raise exception 'Profile PIN must contain exactly four digits'
      using errcode = '22023';
  end if;

  update public.member_profile as profile
  set pin_hash = case
    when selected_pin is null then null
    else extensions.crypt(selected_pin, extensions.gen_salt('bf'))
  end,
      pin_failed_attempts = 0,
      pin_locked_until = null
  from public."user" as account
  where profile.member_profile_id = selected_profile_id
    and profile.user_id = account.user_id
    and account.auth_user_id = (select auth.uid())
    and profile.is_active;

  if not found then
    raise exception 'Member profile does not exist' using errcode = 'P0002';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."set_my_member_profile_pin"(bigint, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_my_member_profile_pin"(bigint, text) FROM PUBLIC;
