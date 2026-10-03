CREATE OR REPLACE FUNCTION public.is_master_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  -- Your function logic here
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_master_admin"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_master_admin"() FROM PUBLIC;
