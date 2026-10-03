CREATE OR REPLACE FUNCTION public.set_member_profile_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."set_member_profile_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
