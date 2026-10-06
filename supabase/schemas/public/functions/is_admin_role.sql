CREATE OR REPLACE FUNCTION public.is_admin_role (
  required_role character varying
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select public.is_master_admin() or exists (
    select 1
    from public.admin
    where auth_user_id = (select auth.uid())
      and lower(replace(role, ' ', '')) = lower(replace(required_role, ' ', ''))
      and lower(coalesce(status, 'Active')) = 'active'
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_admin_role"(character varying) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_admin_role"(character varying) FROM PUBLIC;
