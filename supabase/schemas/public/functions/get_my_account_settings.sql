CREATE OR REPLACE FUNCTION public.get_my_account_settings()
  RETURNS TABLE (
    first_name     character varying,
    last_name      character varying,
    email          character varying,
    date_of_birth  date,
    plan_name      character varying,
    monthly_price  numeric,
    max_user       integer,
    payment_date   timestamp with time zone,
    payment_amount numeric,
    end_date       timestamp with time zone,
    payment_method character varying
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    account.first_name,
    account.last_name,
    account.email,
    account.date_of_birth,
    plan.plan_name,
    plan.monthly_price,
    plan.max_user,
    account.payment_date,
    account.payment_amount,
    account.end_date,
    account.payment_method
  from public."user" as account
  left join public.subscription as plan
    on plan.subscription_id = account.subscription_id
  where account.auth_user_id = (select auth.uid())
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_account_settings"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_account_settings"() FROM PUBLIC;
