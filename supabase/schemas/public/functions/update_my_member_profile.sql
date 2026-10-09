CREATE OR REPLACE FUNCTION public.update_my_member_profile (
  selected_profile_id   bigint,
  selected_profile_name text,
  selected_avatar_path  text,
  selected_pin          text    DEFAULT NULL::text,
  remove_pin            boolean DEFAULT false
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  normalized_name text := btrim(selected_profile_name);
  normalized_avatar text := btrim(selected_avatar_path);
  normalized_pin text := nullif(btrim(selected_pin), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if normalized_name = '' or char_length(normalized_name) > 50 then
    raise exception 'Profile name must contain 1 to 50 characters'
      using errcode = '22023';
  end if;
  if normalized_pin is not null and normalized_pin !~ '^[0-9]{4}$' then
    raise exception 'Profile PIN must contain exactly four digits'
      using errcode = '22023';
  end if;
  if not exists (
    select 1
    from storage.objects as avatar
    where avatar.bucket_id = 'avatar'
      and avatar.name = normalized_avatar
  ) then
    raise exception 'Selected avatar does not exist' using errcode = '22023';
  end if;

  update public.member_profile as profile
  set profile_name = normalized_name,
      avatar_image = normalized_avatar,
      pin_hash = case
        when remove_pin then null
        when normalized_pin is not null
          then extensions.crypt(normalized_pin, extensions.gen_salt('bf'))
        else profile.pin_hash
      end,
      pin_failed_attempts = case
        when remove_pin or normalized_pin is not null then 0
        else profile.pin_failed_attempts
      end,
      pin_locked_until = case
        when remove_pin or normalized_pin is not null then null
        else profile.pin_locked_until
      end
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

GRANT EXECUTE ON FUNCTION "public"."update_my_member_profile"(bigint, text, text, text, boolean) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_my_member_profile"(bigint, text, text, text, boolean) FROM PUBLIC;
