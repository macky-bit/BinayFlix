CREATE OR REPLACE FUNCTION public.get_subscription_plans()
  RETURNS TABLE (
    subscription_id bigint,
    plan_name       text,
    monthly_price   numeric,
    max_user        integer
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    s.subscription_id,
    s.plan_name::text,
    s.monthly_price,
    s.max_user
  from public.subscription as s
  order by s.monthly_price, s.subscription_id;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_subscription_plans"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_subscription_plans"() FROM PUBLIC;
