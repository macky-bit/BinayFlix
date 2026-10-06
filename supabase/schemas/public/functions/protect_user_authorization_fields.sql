CREATE OR REPLACE FUNCTION public.protect_user_authorization_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  -- Auth synchronization runs inside trusted SECURITY DEFINER functions owned
  -- by postgres. service_role is likewise an explicitly trusted backend role.
  if current_user in ('postgres', 'service_role', 'supabase_auth_admin') then
    return new;
  end if;

  if new.user_role is distinct from old.user_role
    or new.auth_user_id is distinct from old.auth_user_id then
    if not public.is_master_admin() then
      raise exception 'Only a Master Admin may change account role or identity fields.'
        using errcode = '42501';
    end if;
  end if;

  if new.account_status is distinct from old.account_status
    and not public.is_any_admin() then
    raise exception 'Only an active administrator may change account status.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."protect_user_authorization_fields"() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."protect_user_authorization_fields"() TO "postgres", "service_role";
