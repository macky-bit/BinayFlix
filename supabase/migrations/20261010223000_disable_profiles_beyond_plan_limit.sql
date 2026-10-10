BEGIN;

DROP FUNCTION IF EXISTS public.get_my_member_profiles();

CREATE FUNCTION public.get_my_member_profiles()
RETURNS TABLE (
  member_profile_id bigint,
  profile_name character varying,
  avatar_image text,
  is_kids boolean,
  has_pin boolean,
  display_order smallint,
  is_entitled boolean,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    profile.member_profile_id,
    profile.profile_name,
    profile.avatar_image,
    profile.is_kids,
    profile.pin_hash IS NOT NULL AS has_pin,
    profile.display_order,
    row_number() OVER (
      PARTITION BY profile.user_id
      ORDER BY profile.display_order, profile.member_profile_id
    ) <= COALESCE(entitlement.max_user, 0) AS is_entitled,
    profile.is_active,
    profile.created_at,
    profile.updated_at
  FROM public.member_profile AS profile
  JOIN public."user" AS account
    ON account.user_id = profile.user_id
  LEFT JOIN LATERAL (
    SELECT plan.max_user
    FROM public.user_subscription AS membership
    JOIN public.subscription AS plan
      ON plan.subscription_id = membership.subscription_id
    WHERE membership.user_id = account.user_id
      AND lower(membership.status) = 'active'
      AND (membership.ends_at IS NULL OR membership.ends_at > now())
    ORDER BY membership.started_at DESC, membership.user_subscription_id DESC
    LIMIT 1
  ) AS entitlement ON true
  WHERE account.auth_user_id = (SELECT auth.uid())
    AND profile.is_active
  ORDER BY profile.display_order;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_member_profiles()
TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.get_my_member_profiles() FROM PUBLIC, anon;

COMMIT;
