BEGIN;

DROP POLICY IF EXISTS user_can_view_available_content ON public.content;
CREATE POLICY user_can_view_available_content ON public.content
FOR SELECT TO PUBLIC
USING (
  publishing_status = 'ready'
  AND (
    catalog_source = 'tmdb'
    OR (
      availability_status = 'available'
      AND NULLIF(btrim(video_file), '') IS NOT NULL
    )
  )
);

COMMIT;
