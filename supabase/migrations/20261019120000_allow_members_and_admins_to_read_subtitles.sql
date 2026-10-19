BEGIN;

DROP POLICY IF EXISTS authenticated_can_read_title_subtitles ON storage.objects;

CREATE POLICY authenticated_can_read_title_subtitles
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'subtitle'
  AND (
    public.is_any_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM public."user" AS account
        JOIN public.user_subscription AS membership
          ON membership.user_id = account.user_id
        WHERE account.auth_user_id = (SELECT auth.uid())
          AND lower(membership.status) = 'active'
          AND (membership.ends_at IS NULL OR membership.ends_at > now())
      )
      AND EXISTS (
        SELECT 1
        FROM public.content AS title
        WHERE title.subtitle = storage.objects.name
          AND title.publishing_status = 'ready'
          AND (
            title.catalog_source = 'tmdb'
            OR (
              title.availability_status = 'available'
              AND NULLIF(btrim(title.video_file), '') IS NOT NULL
            )
          )
      )
    )
  )
);

COMMIT;
