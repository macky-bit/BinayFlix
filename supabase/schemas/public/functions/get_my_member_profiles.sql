CREATE OR REPLACE FUNCTION public.get_my_member_profiles()
  RETURNS TABLE (
    member_profile_id bigint,
    profile_name      character varying,
    avatar_image      text,
    is_kids           boolean,
    display_order     smallint,
    is_active         boolean,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    profile.member_profile_id,
    profile.profile_name,
    profile.avatar_image,
    profile.is_kids,
    profile.display_order,
    profile.is_active,
    profile.created_at,
    profile.updated_at
  from public.member_profile as profile
  join public."user" as account
    on account.user_id = profile.user_id
  where account.auth_user_id = (select auth.uid())
    and profile.is_active
  order by profile.display_order;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_member_profiles"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_member_profiles"() FROM PUBLIC;
