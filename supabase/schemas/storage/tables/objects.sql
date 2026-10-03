CREATE POLICY "authenticated_can_read_avatar_assets" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'avatar'::text));
