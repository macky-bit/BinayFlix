BEGIN;

UPDATE public.content
SET availability_status = 'unavailable'
WHERE availability_status = 'available'
  AND (
    publishing_status <> 'ready'
    OR NULLIF(btrim(video_file), '') IS NULL
  );

ALTER TABLE public.content
  DROP CONSTRAINT IF EXISTS content_available_requires_uploaded_video;

ALTER TABLE public.content
  ADD CONSTRAINT content_available_requires_uploaded_video
  CHECK (
    availability_status <> 'available'
    OR (
      publishing_status = 'ready'
      AND NULLIF(btrim(video_file), '') IS NOT NULL
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_content_publish_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  required_prefix text := 'content/' || NEW.content_id || '/';
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_any_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.total_streams_count := 0;
      NEW.catalog_source := 'manual';
      NEW.synced_at := NULL;
      NEW.popularity_rank := NULL;
      NEW.availability_status := 'unavailable';
    ELSE
      NEW.total_streams_count := OLD.total_streams_count;
      NEW.catalog_source := OLD.catalog_source;
      NEW.synced_at := OLD.synced_at;
    END IF;
  END IF;

  IF NEW.availability_status = 'available' THEN
    IF NEW.publishing_status <> 'ready'
      OR NULLIF(btrim(NEW.video_file), '') IS NULL THEN
      RAISE EXCEPTION 'Available content requires a ready uploaded video';
    END IF;

    IF NEW.catalog_source = 'manual' THEN
      IF NEW.video_file NOT LIKE required_prefix || 'video/%'
        OR NULLIF(btrim(NEW.thumbnail), '') IS NULL
        OR NEW.thumbnail NOT LIKE required_prefix || 'thumbnail/%' THEN
        RAISE EXCEPTION 'Manual content assets must use their content ID path';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'video_file' AND name = NEW.video_file
      ) OR NOT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'content-thumbnails' AND name = NEW.thumbnail
      ) THEN
        RAISE EXCEPTION 'Available content requires uploaded video and thumbnail objects';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_content_publish_contract()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_content_publish_contract ON public.content;
CREATE TRIGGER enforce_content_publish_contract
BEFORE INSERT OR UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION public.enforce_content_publish_contract();

DROP POLICY IF EXISTS user_can_view_available_content ON public.content;
CREATE POLICY user_can_view_available_content ON public.content
FOR SELECT TO PUBLIC
USING (
  availability_status = 'available'
  AND publishing_status = 'ready'
  AND NULLIF(btrim(video_file), '') IS NOT NULL
);

COMMIT;
