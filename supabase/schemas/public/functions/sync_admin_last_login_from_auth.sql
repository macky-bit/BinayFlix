CREATE OR REPLACE FUNCTION public.sync_admin_last_login_from_auth()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.last_sign_in_at is not null
     and new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.admin
    set
      last_login = new.last_sign_in_at,
      updated_at = now()
    where auth_user_id = new.id;
  end if;

  return new;
end;
$function$;

REVOKE ALL ON FUNCTION public.sync_admin_last_login_from_auth() FROM PUBLIC, anon, authenticated;
