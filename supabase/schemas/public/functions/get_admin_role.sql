CREATE OR REPLACE FUNCTION public.get_admin_role()
  RETURNS character varying
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select role
  from public.admin
  where auth_user_id = (select auth.uid())
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_admin_role"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_admin_role"() FROM PUBLIC;
