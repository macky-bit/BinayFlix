CREATE OR REPLACE FUNCTION public.is_master_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select exists (
    select 1
    from public.admin
    where auth_user_id = (select auth.uid())
      and lower(replace(role, ' ', '')) = 'masteradmin'
      and lower(coalesce(status, 'Active')) = 'active'
  ) or exists (
    select 1
    from public."user"
    where auth_user_id = (select auth.uid())
      and lower(replace(user_role, ' ', '')) = 'masteradmin'
      and lower(coalesce(account_status, 'Active')) = 'active'
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_master_admin"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_master_admin"() FROM PUBLIC;
