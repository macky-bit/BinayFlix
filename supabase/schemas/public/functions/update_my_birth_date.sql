CREATE OR REPLACE FUNCTION public.update_my_birth_date (
  selected_birth_date date
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if selected_birth_date is null or selected_birth_date > current_date then
    raise exception 'A valid birthdate is required' using errcode = '22023';
  end if;

  update public."user" as account
  set date_of_birth = selected_birth_date
  where account.auth_user_id = (select auth.uid());

  if not found then
    raise exception 'Application account does not exist' using errcode = 'P0002';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_my_birth_date"(date) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_my_birth_date"(date) FROM PUBLIC;
