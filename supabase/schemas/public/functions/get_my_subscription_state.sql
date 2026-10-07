CREATE OR REPLACE FUNCTION public.get_my_subscription_state()
  RETURNS TABLE (
    is_active       boolean,
    subscription_id bigint,
    plan_name       character varying,
    monthly_price   numeric,
    max_user        integer,
    payment_date    timestamp with time zone,
    end_date        timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    active_subscription.user_subscription_id is not null,
    active_subscription.subscription_id,
    plan.plan_name,
    plan.monthly_price,
    plan.max_user,
    active_subscription.started_at,
    active_subscription.ends_at
  from public."user" as account
  left join lateral (
    select membership.*
    from public.user_subscription as membership
    where membership.user_id = account.user_id
      and lower(membership.status) = 'active'
      and (membership.ends_at is null or membership.ends_at > now())
    order by membership.started_at desc, membership.user_subscription_id desc
    limit 1
  ) as active_subscription on true
  left join public.subscription as plan
    on plan.subscription_id = active_subscription.subscription_id
  where account.auth_user_id = (select auth.uid())
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_subscription_state"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_subscription_state"() FROM PUBLIC;
