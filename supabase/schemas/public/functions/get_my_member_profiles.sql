CREATE OR REPLACE FUNCTION public.get_my_member_profiles()
  RETURNS TABLE (
    member_profile_id bigint,
    profile_name      character varying,
    avatar_image      text,
    is_kids           boolean,
    has_pin           boolean,
    display_order     smallint,
    is_entitled       boolean,
    is_active         boolean,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    profile.member_profile_id,
    profile.profile_name,
    profile.avatar_image,
    profile.is_kids,
    profile.pin_hash is not null as has_pin,
    profile.display_order,
    row_number() over (
      partition by profile.user_id
      order by profile.display_order, profile.member_profile_id
    ) <= coalesce(entitlement.max_user, 0) as is_entitled,
    profile.is_active,
    profile.created_at,
    profile.updated_at
  from public.member_profile as profile
  join public."user" as account
    on account.user_id = profile.user_id
  left join lateral (
    select plan.max_user
    from public.user_subscription as membership
    join public.subscription as plan
      on plan.subscription_id = membership.subscription_id
    where membership.user_id = account.user_id
      and lower(membership.status) = 'active'
      and (membership.ends_at is null or membership.ends_at > now())
    order by membership.started_at desc, membership.user_subscription_id desc
    limit 1
  ) as entitlement on true
  where account.auth_user_id = (select auth.uid())
    and profile.is_active
  order by profile.display_order;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_member_profiles"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_member_profiles"() FROM PUBLIC;
