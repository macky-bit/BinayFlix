CREATE OR REPLACE FUNCTION public.sync_google_profile (
  auth_user_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  auth_user auth.users%rowtype;
  existing_profile_id uuid;
  existing_auth_user_id uuid;
  full_name text;
  first_name text;
  last_name text;
  generated_username text;
  avatar_url text;
begin
  select a.* into auth_user
  from auth.users as a
  where a.id = auth_user_id;

  if not found then
    raise exception 'Auth user % does not exist', auth_user_id
      using errcode = '23503';
  end if;

  -- Email/password and other providers keep their existing onboarding path.
  if coalesce(auth_user.raw_app_meta_data ->> 'provider', '') <> 'google'
     and not exists (
       select 1
       from auth.identities as i
       where i.user_id = auth_user.id
         and i.provider = 'google'
     ) then
    return;
  end if;

  if auth_user.email is null or btrim(auth_user.email) = '' then
    raise exception 'Google identity % has no email address', auth_user.id
      using errcode = '23502';
  end if;

  full_name := btrim(coalesce(
    auth_user.raw_user_meta_data ->> 'full_name',
    auth_user.raw_user_meta_data ->> 'name',
    ''
  ));
  first_name := btrim(coalesce(auth_user.raw_user_meta_data ->> 'given_name', ''));
  last_name := btrim(coalesce(auth_user.raw_user_meta_data ->> 'family_name', ''));

  if first_name = '' then
    first_name := nullif(split_part(full_name, ' ', 1), '');
  end if;
  if last_name = '' and position(' ' in full_name) > 0 then
    last_name := btrim(substring(full_name from position(' ' in full_name) + 1));
  end if;

  first_name := coalesce(
    nullif(first_name, ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Google user'
  );
  last_name := coalesce(last_name, '');
  avatar_url := nullif(btrim(coalesce(
    auth_user.raw_user_meta_data ->> 'avatar_url',
    auth_user.raw_user_meta_data ->> 'picture',
    ''
  )), '');

  generated_username := lower(regexp_replace(
    split_part(auth_user.email, '@', 1),
    '[^a-zA-Z0-9_]+',
    '',
    'g'
  ));
  if generated_username = '' then
    generated_username := 'user';
  end if;
  generated_username := left(generated_username, 48)
    || '_'
    || replace(auth_user.id::text, '-', '');

  select u.user_id, u.auth_user_id
    into existing_profile_id, existing_auth_user_id
  from public."user" as u
  where u.auth_user_id = auth_user.id;

  if not found then
    select u.user_id, u.auth_user_id
      into existing_profile_id, existing_auth_user_id
    from public."user" as u
    where lower(u.email) = lower(auth_user.email);
  end if;

  if found then
    if existing_auth_user_id is not null
       and existing_auth_user_id <> auth_user.id then
      raise exception 'Profile email is already linked to another identity'
        using errcode = '23505';
    end if;

    update public."user"
    set auth_user_id = auth_user.id,
        avatar_image = coalesce(avatar_image, avatar_url)
    where user_id = existing_profile_id;
  else
    insert into public."user" (
      auth_user_id,
      first_name,
      last_name,
      username,
      avatar_image,
      email,
      password,
      user_role
    ) values (
      auth_user.id,
      first_name,
      last_name,
      generated_username,
      avatar_url,
      auth_user.email,
      null,
      'subscriber'
    );
  end if;

  return;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."sync_google_profile"(uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."sync_google_profile"(uuid) FROM PUBLIC;
