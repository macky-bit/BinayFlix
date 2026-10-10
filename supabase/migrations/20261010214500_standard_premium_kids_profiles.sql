CREATE OR REPLACE FUNCTION public.get_my_member_profile_context()
RETURNS TABLE (
  plan_name character varying,
  max_profiles integer,
  allows_kids boolean,
  active_profile_count integer,
  can_add_profile boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    plan.plan_name,
    plan.max_user,
    lower(plan.plan_name) IN ('standard', 'premium'),
    count(profile.member_profile_id)::integer,
    count(profile.member_profile_id) < plan.max_user
  FROM public."user" AS account
  JOIN LATERAL (
    SELECT membership.subscription_id
    FROM public.user_subscription AS membership
    WHERE membership.user_id = account.user_id
      AND lower(membership.status) = 'active'
      AND (membership.ends_at IS NULL OR membership.ends_at > now())
    ORDER BY membership.started_at DESC, membership.user_subscription_id DESC
    LIMIT 1
  ) AS active_subscription ON true
  JOIN public.subscription AS plan
    ON plan.subscription_id = active_subscription.subscription_id
  LEFT JOIN public.member_profile AS profile
    ON profile.user_id = account.user_id
   AND profile.is_active
  WHERE account.auth_user_id = (SELECT auth.uid())
  GROUP BY plan.plan_name, plan.max_user;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_member_profile_context()
TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.get_my_member_profile_context() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_my_member_profile(
  selected_profile_name text,
  selected_avatar_path text,
  selected_is_kids boolean DEFAULT false,
  selected_pin text DEFAULT NULL::text
)
RETURNS TABLE (
  member_profile_id bigint,
  profile_name character varying,
  avatar_image text,
  is_kids boolean,
  display_order smallint,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_auth_user_id uuid := auth.uid();
  account_row public."user"%rowtype;
  plan_row public.subscription%rowtype;
  active_count integer;
  next_display_order smallint;
  normalized_name text := btrim(selected_profile_name);
  normalized_avatar text := btrim(selected_avatar_path);
  normalized_pin text := nullif(btrim(selected_pin), '');
BEGIN
  IF current_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '28000';
  END IF;

  IF normalized_name = '' OR char_length(normalized_name) > 50 THEN
    RAISE EXCEPTION 'Profile name must contain 1 to 50 characters'
      USING ERRCODE = '22023';
  END IF;

  SELECT account.* INTO account_row
  FROM public."user" AS account
  WHERE account.auth_user_id = current_auth_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application account does not exist' USING ERRCODE = 'P0002';
  END IF;

  SELECT plan.* INTO plan_row
  FROM public.user_subscription AS membership
  JOIN public.subscription AS plan
    ON plan.subscription_id = membership.subscription_id
  WHERE membership.user_id = account_row.user_id
    AND lower(membership.status) = 'active'
    AND (membership.ends_at IS NULL OR membership.ends_at > now())
  ORDER BY membership.started_at DESC, membership.user_subscription_id DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'An active subscription is required' USING ERRCODE = 'P0001';
  END IF;

  IF selected_is_kids
    AND lower(plan_row.plan_name) NOT IN ('standard', 'premium') THEN
    RAISE EXCEPTION 'Kids profiles require a Standard or Premium plan'
      USING ERRCODE = 'P0001';
  END IF;

  IF normalized_pin IS NOT NULL AND normalized_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'Profile PIN must contain exactly four digits'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects AS avatar
    WHERE avatar.bucket_id = 'avatar'
      AND avatar.name = normalized_avatar
  ) THEN
    RAISE EXCEPTION 'Selected avatar does not exist' USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::integer INTO active_count
  FROM public.member_profile AS profile
  WHERE profile.user_id = account_row.user_id
    AND profile.is_active;

  IF active_count >= plan_row.max_user THEN
    RAISE EXCEPTION 'Subscription profile limit reached' USING ERRCODE = 'P0001';
  END IF;

  SELECT slot::smallint INTO next_display_order
  FROM generate_series(1, plan_row.max_user) AS slot
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.member_profile AS profile
    WHERE profile.user_id = account_row.user_id
      AND profile.is_active
      AND profile.display_order = slot
  )
  ORDER BY slot
  LIMIT 1;

  RETURN QUERY
  INSERT INTO public.member_profile (
    user_id,
    profile_name,
    avatar_image,
    is_kids,
    pin_hash,
    display_order
  ) VALUES (
    account_row.user_id,
    normalized_name,
    normalized_avatar,
    selected_is_kids,
    CASE
      WHEN normalized_pin IS NULL THEN NULL
      ELSE extensions.crypt(normalized_pin, extensions.gen_salt('bf'))
    END,
    next_display_order
  )
  RETURNING
    member_profile.member_profile_id,
    member_profile.profile_name,
    member_profile.avatar_image,
    member_profile.is_kids,
    member_profile.display_order,
    member_profile.is_active,
    member_profile.created_at,
    member_profile.updated_at;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_my_member_profile(text, text, boolean, text)
TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.create_my_member_profile(text, text, boolean, text)
FROM PUBLIC;
