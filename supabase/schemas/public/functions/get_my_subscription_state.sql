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
    coalesce(u.end_date > now() and u.subscription_id is not null, false),
    u.subscription_id,
    s.plan_name,
    s.monthly_price,
    s.max_user,
    u.payment_date,
    u.end_date
  from public."user" as u
  left join public.subscription as s
    on s.subscription_id = u.subscription_id
  where u.auth_user_id = (select auth.uid())
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_subscription_state"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_subscription_state"() FROM PUBLIC;
