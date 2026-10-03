CREATE TABLE "public"."content_comment" (
  "content_id"   bigint                      NOT NULL,
  "comment_text" text                        NOT NULL,
  "commented_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id"      uuid                        NOT NULL,
  CONSTRAINT "content_comment_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "content_comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."content_comment"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX content_comment_content_id_idx ON public.content_comment USING btree (content_id);

CREATE INDEX content_comment_user_id_idx ON public.content_comment USING btree (user_id);

CREATE POLICY "allow_comment_delete" ON "public"."content_comment"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_any_admin() OR (user_id IN ( SELECT u.user_id
   FROM public."user" u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "anyone_can_read_comments" ON "public"."content_comment"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "user_can_insert_own_comment" ON "public"."content_comment"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((user_id IN ( SELECT u.user_id
   FROM public."user" u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."content_comment" TO "anon", "authenticated", "postgres", "service_role";
