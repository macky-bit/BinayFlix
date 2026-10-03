CREATE OR REPLACE FUNCTION public.is_admin_role (
  required_role character varying
)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select exists (
    select 1
    from public.admin
    where auth_user_id = (select auth.uid())
      and role = required_role
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_admin_role"(character varying) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_admin_role"(character varying) FROM PUBLIC;
