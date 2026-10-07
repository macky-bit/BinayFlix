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
  RETURN NEW;
END;
$$;
