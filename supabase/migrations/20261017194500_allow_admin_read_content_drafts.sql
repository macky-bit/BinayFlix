CREATE POLICY content_admin_read_all
ON public.content
FOR SELECT
TO authenticated
USING (public.is_any_admin());
