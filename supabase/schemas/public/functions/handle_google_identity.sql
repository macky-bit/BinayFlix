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

GRANT EXECUTE ON FUNCTION "public"."handle_google_identity"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
