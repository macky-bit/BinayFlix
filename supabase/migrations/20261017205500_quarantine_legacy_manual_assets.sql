UPDATE public.content AS content
SET availability_status = 'unavailable',
    publishing_status = 'failed'
WHERE content.catalog_source = 'manual'
  AND (
    content.thumbnail IS NULL
    OR content.thumbnail NOT LIKE 'content/' || content.content_id || '/thumbnail/%'
    OR content.video_file IS NULL
    OR content.video_file NOT LIKE 'content/' || content.content_id || '/video/%'
    OR (
      content.subtitle IS NOT NULL
      AND content.subtitle NOT LIKE 'content/' || content.content_id || '/subtitle/%'
    )
    OR NOT EXISTS (
      SELECT 1
      FROM storage.objects AS object
      WHERE object.bucket_id = 'content-thumbnails'
        AND object.name = content.thumbnail
    )
    OR NOT EXISTS (
      SELECT 1
      FROM storage.objects AS object
      WHERE object.bucket_id = 'video_file'
        AND object.name = content.video_file
    )
    OR (
      content.subtitle IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM storage.objects AS object
        WHERE object.bucket_id = 'subtitle'
          AND object.name = content.subtitle
      )
    )
  );
