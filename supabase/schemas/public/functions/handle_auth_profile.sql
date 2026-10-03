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

GRANT EXECUTE ON FUNCTION "public"."handle_auth_profile"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
