CREATE OR REPLACE FUNCTION public.handle_auth_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform public.sync_auth_profile(new.id);
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_auth_profile"() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_auth_profile"() TO "postgres", "service_role";
