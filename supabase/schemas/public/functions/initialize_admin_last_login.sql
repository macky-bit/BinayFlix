CREATE OR REPLACE FUNCTION public.initialize_admin_last_login()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.last_login is null and new.auth_user_id is not null then
    select auth_user.last_sign_in_at
    into new.last_login
    from auth.users as auth_user
    where auth_user.id = new.auth_user_id;
  end if;

  return new;
end;
$function$;

REVOKE ALL ON FUNCTION public.initialize_admin_last_login() FROM PUBLIC, anon, authenticated;
