CREATE OR REPLACE FUNCTION public.protect_content_comment_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
    AND NOT public.is_admin_role('commentManager'::character varying)
    AND NOT public.is_master_admin()
  THEN
    RAISE EXCEPTION 'Only community moderators can change comment status';
  END IF;

  IF (
    NEW.content_id IS DISTINCT FROM OLD.content_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.member_profile_id IS DISTINCT FROM OLD.member_profile_id
  )
    AND NOT public.is_admin_role('commentManager'::character varying)
    AND NOT public.is_master_admin()
  THEN
    RAISE EXCEPTION 'Comment authorship cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;
