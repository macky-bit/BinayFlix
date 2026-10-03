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

GRANT EXECUTE ON FUNCTION "public"."handle_google_auth_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
