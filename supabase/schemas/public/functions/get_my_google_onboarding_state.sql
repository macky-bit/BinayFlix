CREATE OR REPLACE FUNCTION public.get_my_google_onboarding_state()
  RETURNS TABLE (
    requires_onboarding boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    (
      exists (
        select 1
        from auth.identities as identity
        where identity.user_id = auth_account.id
          and identity.provider = 'google'
      )
      or coalesce(auth_account.raw_app_meta_data ->> 'provider', '') = 'google'
      or coalesce(
        auth_account.raw_app_meta_data -> 'providers',
        '[]'::jsonb
      ) ? 'google'
    )
    and (
      coalesce(
        (auth_account.raw_user_meta_data
          ->> 'streamflix_onboarding_complete')::boolean,
        false
      ) = false
      or app_account.date_of_birth is null
      or coalesce(auth_account.encrypted_password, '') = ''
    )
  from auth.users as auth_account
  left join public."user" as app_account
    on app_account.auth_user_id = auth_account.id
  where auth_account.id = (select auth.uid())
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_google_onboarding_state"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_google_onboarding_state"() FROM PUBLIC;
