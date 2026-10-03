CREATE OR REPLACE FUNCTION public.activate_my_subscription (
  selected_subscription_id bigint
)
  RETURNS TABLE (
    subscription_id  bigint,
    plan_name        character varying,
    monthly_price    numeric,
    max_user         integer,
    payment_date     timestamp with time zone,
    end_date         timestamp with time zone,
    payment_method   character varying,
    reference_number character varying
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_auth_user_id uuid := auth.uid();
  selected_plan public.subscription%rowtype;
  activated_at timestamptz := now();
  affected_rows integer;
begin
  if current_auth_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  select s.* into selected_plan
  from public.subscription as s
  where s.subscription_id = selected_subscription_id;

  if not found then
    raise exception 'Subscription plan does not exist' using errcode = '22023';
  end if;

  update public."user" as u
  set subscription_id = selected_plan.subscription_id,
      payment_date = activated_at,
      payment_amount = selected_plan.monthly_price,
      payment_method = 'prototype',
      reference_number = 'prototype_'
        || replace(gen_random_uuid()::text, '-', ''),
      end_date = activated_at + interval '1 month'
  where u.auth_user_id = current_auth_user_id
    and (u.end_date is null or u.end_date <= activated_at);

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    if exists (
      select 1
      from public."user" as u
      where u.auth_user_id = current_auth_user_id
        and u.end_date > activated_at
    ) then
      raise exception 'Subscription is already active' using errcode = 'P0001';
    end if;
    raise exception 'Application profile does not exist' using errcode = 'P0002';
  end if;

  return query
  select
    selected_plan.subscription_id,
    selected_plan.plan_name,
    selected_plan.monthly_price,
    selected_plan.max_user,
    u.payment_date,
    u.end_date,
    u.payment_method,
    u.reference_number
  from public."user" as u
  where u.auth_user_id = current_auth_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."activate_my_subscription"(bigint) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."activate_my_subscription"(bigint) FROM PUBLIC;
