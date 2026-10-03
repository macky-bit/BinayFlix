CREATE OR REPLACE FUNCTION public.update_my_account_profile (
  selected_first_name text,
  selected_last_name  text,
  selected_birth_date date
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  normalized_first_name text := btrim(selected_first_name);
  normalized_last_name text := btrim(selected_last_name);
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if normalized_first_name = '' or char_length(normalized_first_name) > 80 then
    raise exception 'First name must contain 1 to 80 characters'
      using errcode = '22023';
  end if;
  if char_length(normalized_last_name) > 80 then
    raise exception 'Last name must contain at most 80 characters'
      using errcode = '22023';
  end if;
  if selected_birth_date is null or selected_birth_date > current_date then
    raise exception 'A valid birthdate is required' using errcode = '22023';
  end if;

  update public."user" as account
  set first_name = normalized_first_name,
      last_name = normalized_last_name,
      date_of_birth = selected_birth_date
  where account.auth_user_id = (select auth.uid());

  if not found then
    raise exception 'Application account does not exist' using errcode = 'P0002';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_my_account_profile"(text, text, date) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_my_account_profile"(text, text, date) FROM PUBLIC;
