BEGIN;

DROP POLICY IF EXISTS refresher_video_authenticated_read ON storage.objects;

CREATE POLICY refresher_video_authenticated_read
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'refresher_video_url');

COMMIT;
