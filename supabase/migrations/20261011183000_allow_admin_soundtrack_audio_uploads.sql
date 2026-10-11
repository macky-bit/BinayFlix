DROP POLICY IF EXISTS soundtrack_stream_admin_insert ON storage.objects;

CREATE POLICY soundtrack_stream_admin_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stream_link'
  AND public.is_any_admin()
);
