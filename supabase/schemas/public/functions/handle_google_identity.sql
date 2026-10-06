CREATE OR REPLACE FUNCTION public.handle_google_identity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.provider = 'google' then
    perform public.sync_auth_profile(new.user_id);
  end if;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_google_identity"() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_google_identity"() TO "postgres", "service_role";
