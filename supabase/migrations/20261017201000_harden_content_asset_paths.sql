BEGIN;

DROP POLICY IF EXISTS content_media_admin_insert ON storage.objects;
CREATE POLICY content_media_admin_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  public.is_any_admin()
  AND (
    (bucket_id = 'content-thumbnails' AND name ~ '^content/[1-9][0-9]*/thumbnail/[^/]+$')
    OR (bucket_id = 'video_file' AND name ~ '^content/[1-9][0-9]*/video/[^/]+$')
    OR (bucket_id = 'subtitle' AND name ~ '^content/[1-9][0-9]*/subtitle/[^/]+$')
  )
  AND EXISTS (
    SELECT 1
    FROM public.content c
    WHERE c.content_id::text = split_part(name, '/', 2)
  )
);

DROP POLICY IF EXISTS content_media_admin_update ON storage.objects;
CREATE POLICY content_media_admin_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  public.is_any_admin()
  AND (
    (bucket_id = 'content-thumbnails' AND name ~ '^content/[1-9][0-9]*/thumbnail/[^/]+$')
    OR (bucket_id = 'video_file' AND name ~ '^content/[1-9][0-9]*/video/[^/]+$')
    OR (bucket_id = 'subtitle' AND name ~ '^content/[1-9][0-9]*/subtitle/[^/]+$')
  )
  AND EXISTS (
    SELECT 1
    FROM public.content c
    WHERE c.content_id::text = split_part(name, '/', 2)
  )
)
WITH CHECK (
  public.is_any_admin()
  AND (
    (bucket_id = 'content-thumbnails' AND name ~ '^content/[1-9][0-9]*/thumbnail/[^/]+$')
    OR (bucket_id = 'video_file' AND name ~ '^content/[1-9][0-9]*/video/[^/]+$')
    OR (bucket_id = 'subtitle' AND name ~ '^content/[1-9][0-9]*/subtitle/[^/]+$')
  )
  AND EXISTS (
    SELECT 1
    FROM public.content c
    WHERE c.content_id::text = split_part(name, '/', 2)
  )
);

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
);

COMMIT;
