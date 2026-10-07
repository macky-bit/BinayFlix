CREATE OR REPLACE FUNCTION public.get_my_member_profile_context()
  RETURNS TABLE (
    plan_name            character varying,
    max_profiles         integer,
    allows_kids          boolean,
    active_profile_count integer,
    can_add_profile      boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    plan.plan_name,
    plan.max_user,
    lower(plan.plan_name) in ('basic', 'premium'),
    count(profile.member_profile_id)::integer,
    count(profile.member_profile_id) < plan.max_user
  from public."user" as account
  join lateral (
    select membership.subscription_id
    from public.user_subscription as membership
    where membership.user_id = account.user_id
      and lower(membership.status) = 'active'
      and (membership.ends_at is null or membership.ends_at > now())
    order by membership.started_at desc, membership.user_subscription_id desc
    limit 1
  ) as active_subscription on true
  join public.subscription as plan
    on plan.subscription_id = active_subscription.subscription_id
  left join public.member_profile as profile
    on profile.user_id = account.user_id
   and profile.is_active
  where account.auth_user_id = (select auth.uid())
  group by plan.plan_name, plan.max_user;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_member_profile_context"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_member_profile_context"() FROM PUBLIC;
