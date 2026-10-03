CREATE OR REPLACE FUNCTION public.route_user_by_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  -- If the new user's role is 'subscriber', insert into subscriber
  IF NEW.user_role = 'subscriber' THEN
    INSERT INTO subscriber (user_id)
    VALUES (NEW.user_id);

  -- If the new user's role is 'member_profile', insert into member_profile
  ELSIF NEW.user_role = 'member_profile' THEN
    INSERT INTO member_profile (user_id, is_active)
    VALUES (NEW.user_id, TRUE);
  END IF;

  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."route_user_by_role"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
