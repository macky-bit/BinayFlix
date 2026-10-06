CREATE OR REPLACE FUNCTION public.sync_streamflix_account_email()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.email is distinct from old.email
    and new.email_confirmed_at is not null then
    update public."user" as account
    set email = new.email
    where account.auth_user_id = new.id;
  end if;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."sync_streamflix_account_email"() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_streamflix_account_email"() TO "postgres", "service_role";
