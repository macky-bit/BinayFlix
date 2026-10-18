DROP POLICY IF EXISTS content_media_admin_delete ON storage.objects;
CREATE POLICY content_media_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  public.is_any_admin()
  AND (
    (bucket_id = 'content-thumbnails' AND name ~ '^content/[1-9][0-9]*/thumbnail/[^/]+$')
    OR (bucket_id = 'video_file' AND name ~ '^content/[1-9][0-9]*/video/[^/]+$')
    OR (bucket_id = 'subtitle' AND name ~ '^content/[1-9][0-9]*/subtitle/[^/]+$')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.content c
    WHERE (bucket_id = 'content-thumbnails' AND c.thumbnail = name)
      OR (bucket_id = 'video_file' AND c.video_file = name)
      OR (bucket_id = 'subtitle' AND c.subtitle = name)
  )
);
