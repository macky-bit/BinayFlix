CREATE TABLE "public"."previous_film_refresher" (
  "content_id"             bigint                 NOT NULL,
  "refresher_title"        character varying(255),
  "refresher_video_url"    text,
  "refresher_text_summary" text,
  CONSTRAINT "previous_film_refresher_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."previous_film_refresher"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_previous_film_refresher_content_id ON public.previous_film_refresher USING btree (content_id);

CREATE POLICY "content_manager_delete_refresher" ON "public"."previous_film_refresher"
  FOR DELETE
  TO "authenticated"
  USING (public.is_any_admin());

CREATE POLICY "content_manager_insert_refresher" ON "public"."previous_film_refresher"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_any_admin());

CREATE POLICY "content_manager_update_refresher" ON "public"."previous_film_refresher"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_any_admin())
  WITH CHECK (public.is_any_admin());

CREATE POLICY "user_can_view_refresher" ON "public"."previous_film_refresher"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."previous_film_refresher" TO "anon", "authenticated", "postgres", "service_role";
