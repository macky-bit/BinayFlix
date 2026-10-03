CREATE OR REPLACE FUNCTION public.create_my_member_profile (
  selected_profile_name text,
  selected_avatar_path  text,
  selected_is_kids      boolean DEFAULT false,
  selected_pin          text    DEFAULT NULL::text
)
  RETURNS TABLE (
    member_profile_id bigint,
    profile_name      character varying,
    avatar_image      text,
    is_kids           boolean,
    display_order     smallint,
    is_active         boolean,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_auth_user_id uuid := auth.uid();
  account_row public."user"%rowtype;
  plan_row public.subscription%rowtype;
  active_count integer;
  next_display_order smallint;
  normalized_name text := btrim(selected_profile_name);
  normalized_avatar text := btrim(selected_avatar_path);
  normalized_pin text := nullif(btrim(selected_pin), '');
begin
  if current_auth_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if normalized_name = '' or char_length(normalized_name) > 50 then
    raise exception 'Profile name must contain 1 to 50 characters'
      using errcode = '22023';
  end if;

  select account.* into account_row
  from public."user" as account
  where account.auth_user_id = current_auth_user_id
  for update;

  if not found then
    raise exception 'Application account does not exist' using errcode = 'P0002';
  end if;

  if account_row.subscription_id is null
    or account_row.end_date is null
    or account_row.end_date <= now() then
    raise exception 'An active subscription is required' using errcode = 'P0001';
  end if;

  select plan.* into plan_row
  from public.subscription as plan
  where plan.subscription_id = account_row.subscription_id;

  if selected_is_kids
    and lower(plan_row.plan_name) not in ('basic', 'premium') then
    raise exception 'Kids profiles require a Basic or Premium plan'
      using errcode = 'P0001';
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

  select count(*)::integer into active_count
  from public.member_profile as profile
  where profile.user_id = account_row.user_id
    and profile.is_active;

  if active_count >= plan_row.max_user then
    raise exception 'Subscription profile limit reached' using errcode = 'P0001';
  end if;

  select slot::smallint into next_display_order
  from generate_series(1, plan_row.max_user) as slot
  where not exists (
    select 1
    from public.member_profile as profile
    where profile.user_id = account_row.user_id
      and profile.is_active
      and profile.display_order = slot
  )
  order by slot
  limit 1;

  return query
  insert into public.member_profile (
    user_id,
    profile_name,
    avatar_image,
    is_kids,
    pin_hash,
    display_order
  ) values (
    account_row.user_id,
    normalized_name,
    normalized_avatar,
    selected_is_kids,
    case
      when normalized_pin is null then null
      else extensions.crypt(normalized_pin, extensions.gen_salt('bf'))
    end,
    next_display_order
  )
  returning
    member_profile.member_profile_id,
    member_profile.profile_name,
    member_profile.avatar_image,
    member_profile.is_kids,
    member_profile.display_order,
    member_profile.is_active,
    member_profile.created_at,
    member_profile.updated_at;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_my_member_profile"(text, text, boolean, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_my_member_profile"(text, text, boolean, text) FROM PUBLIC;
