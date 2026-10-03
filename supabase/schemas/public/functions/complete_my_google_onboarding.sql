CREATE OR REPLACE FUNCTION public.complete_my_google_onboarding (
  selected_birth_date date
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_auth_user_id uuid := auth.uid();
begin
  if current_auth_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if selected_birth_date is null or selected_birth_date > current_date then
    raise exception 'A valid birthdate is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.identities as identity
    where identity.user_id = current_auth_user_id
      and identity.provider = 'google'
  ) then
    raise exception 'Google authentication is required' using errcode = '42501';
  end if;

  update public."user" as account
  set date_of_birth = selected_birth_date,
      password = null
  where account.auth_user_id = current_auth_user_id;

  if not found then
    raise exception 'Application account does not exist' using errcode = 'P0002';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."complete_my_google_onboarding"(date) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."complete_my_google_onboarding"(date) FROM PUBLIC;
