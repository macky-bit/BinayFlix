CREATE OR REPLACE FUNCTION public.handle_google_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform public.sync_google_profile(new.id);
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_google_auth_user"() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_google_auth_user"() TO "postgres", "service_role";
