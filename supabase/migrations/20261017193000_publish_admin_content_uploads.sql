BEGIN;

ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS publishing_status varchar(20) NOT NULL DEFAULT 'ready';

ALTER TABLE public.content
  DROP CONSTRAINT IF EXISTS content_publishing_status_check;

ALTER TABLE public.content
  ADD CONSTRAINT content_publishing_status_check
  CHECK (publishing_status IN ('draft', 'uploading', 'ready', 'failed'));

DROP POLICY IF EXISTS user_can_view_available_content ON public.content;
CREATE POLICY user_can_view_available_content ON public.content
FOR SELECT TO PUBLIC
USING (
  availability_status = 'available'
  AND publishing_status = 'ready'
);

DROP POLICY IF EXISTS content_genre_admin_write ON public.content_genre;
CREATE POLICY content_genre_admin_write ON public.content_genre
FOR ALL TO authenticated
USING (public.is_any_admin())
WITH CHECK (public.is_any_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-thumbnails',
  'content-thumbnails',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video_file',
  'video_file',
  false,
  5368709120,
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'subtitle',
  'subtitle',
  false,
  5242880,
  ARRAY['application/x-subrip', 'text/plain', 'text/vtt', 'text/x-ssa', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS content_media_admin_insert ON storage.objects;
CREATE POLICY content_media_admin_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('content-thumbnails', 'video_file', 'subtitle')
  AND name LIKE 'content/%'
  AND public.is_any_admin()
);

DROP POLICY IF EXISTS content_media_admin_update ON storage.objects;
CREATE POLICY content_media_admin_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('content-thumbnails', 'video_file', 'subtitle')
  AND name LIKE 'content/%'
  AND public.is_any_admin()
)
WITH CHECK (
  bucket_id IN ('content-thumbnails', 'video_file', 'subtitle')
  AND name LIKE 'content/%'
  AND public.is_any_admin()
);

DROP POLICY IF EXISTS content_media_admin_delete ON storage.objects;
CREATE POLICY content_media_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('content-thumbnails', 'video_file', 'subtitle')
  AND name LIKE 'content/%'
  AND public.is_any_admin()
);

DROP POLICY IF EXISTS subscriber_can_read_published_videos ON storage.objects;
CREATE POLICY subscriber_can_read_published_videos ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'video_file'
  AND EXISTS (
    SELECT 1
    FROM public.content c
    JOIN public.user_subscription us ON true
    JOIN public."user" u ON u.user_id = us.user_id
    WHERE c.video_file = name
      AND u.auth_user_id = auth.uid()
      AND c.availability_status = 'available'
      AND c.publishing_status = 'ready'
      AND lower(us.status) = 'active'
  )
);

DROP POLICY IF EXISTS authenticated_can_read_title_subtitles ON storage.objects;
CREATE POLICY authenticated_can_read_title_subtitles ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'subtitle'
  AND EXISTS (
    SELECT 1
    FROM public.content c
    JOIN public.user_subscription us ON true
    JOIN public."user" u ON u.user_id = us.user_id
    WHERE c.subtitle = name
      AND u.auth_user_id = auth.uid()
      AND c.availability_status = 'available'
      AND c.publishing_status = 'ready'
      AND lower(us.status) = 'active'
  )
);

CREATE OR REPLACE FUNCTION public.create_admin_content_draft(
  p_content jsonb,
  p_genre_ids bigint[] DEFAULT ARRAY[]::bigint[]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_content_id bigint;
  genre_id bigint;
BEGIN
  IF NOT public.is_any_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF btrim(COALESCE(p_content->>'title', '')) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  INSERT INTO public.content (
    category_id, title, synopsis, release_year, runtime, age_rating,
    availability_status, tmdb_id, catalog_source, publishing_status
  ) VALUES (
    NULLIF(p_content->>'category_id', '')::bigint,
    left(btrim(p_content->>'title'), 255),
    p_content->>'synopsis',
    NULLIF(p_content->>'release_year', '')::integer,
    NULLIF(p_content->>'runtime', '')::integer,
    left(COALESCE(p_content->>'age_rating', ''), 20),
    'unavailable',
    NULLIF(p_content->>'tmdb_id', '')::bigint,
    'manual',
    'uploading'
  )
  RETURNING content_id INTO new_content_id;

  FOREACH genre_id IN ARRAY COALESCE(p_genre_ids, ARRAY[]::bigint[]) LOOP
    INSERT INTO public.content_genre (content_id, genre_id)
    VALUES (new_content_id, genre_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN new_content_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_admin_content_upload(
  p_content_id bigint,
  p_thumbnail_path text,
  p_video_path text,
  p_subtitle_path text DEFAULT NULL,
  p_availability_status varchar DEFAULT 'available'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  required_prefix text := 'content/' || p_content_id || '/';
BEGIN
  IF NOT public.is_any_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_availability_status NOT IN ('available', 'unavailable') THEN
    RAISE EXCEPTION 'Invalid availability status';
  END IF;

  IF p_thumbnail_path NOT LIKE required_prefix || '%'
    OR p_video_path NOT LIKE required_prefix || '%'
    OR (p_subtitle_path IS NOT NULL AND p_subtitle_path NOT LIKE required_prefix || '%') THEN
    RAISE EXCEPTION 'Invalid content asset path';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'content-thumbnails' AND name = p_thumbnail_path
  ) OR NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'video_file' AND name = p_video_path
  ) OR (p_subtitle_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'subtitle' AND name = p_subtitle_path
  )) THEN
    RAISE EXCEPTION 'One or more uploaded assets are missing';
  END IF;

  UPDATE public.content
  SET thumbnail = p_thumbnail_path,
      video_file = p_video_path,
      subtitle = p_subtitle_path,
      availability_status = p_availability_status,
      publishing_status = 'ready'
  WHERE content_id = p_content_id AND catalog_source = 'manual';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content draft was not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_content_draft(jsonb, bigint[])
TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_admin_content_upload(bigint, text, text, text, varchar)
TO authenticated;

REVOKE ALL ON FUNCTION public.create_admin_content_draft(jsonb, bigint[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_admin_content_upload(bigint, text, text, text, varchar) FROM PUBLIC, anon;

COMMIT;
