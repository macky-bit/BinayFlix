CREATE TABLE "public"."content_comment" (
  "content_id"   bigint                      NOT NULL,
  "comment_text" text                        NOT NULL,
  "commented_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id"      uuid                        NOT NULL,
  "member_profile_id" bigint,
  CONSTRAINT "content_comment_text_length_check" CHECK ((char_length(btrim(comment_text)) >= 1 AND char_length(btrim(comment_text)) <= 1000)),
  CONSTRAINT "content_comment_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "content_comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "content_comment_member_profile_id_fkey" FOREIGN KEY (member_profile_id) REFERENCES public.member_profile(member_profile_id) ON UPDATE CASCADE ON DELETE SET NULL
);

ALTER TABLE "public"."content_comment"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER protect_content_comment_moderation_fields
  BEFORE UPDATE ON public.content_comment
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_comment_moderation_fields();

CREATE INDEX content_comment_content_id_idx ON public.content_comment USING btree (content_id);

CREATE INDEX content_comment_user_id_idx ON public.content_comment USING btree (user_id);

CREATE INDEX content_comment_member_profile_id_idx ON public.content_comment USING btree (member_profile_id);

CREATE POLICY "content_comment_owner_or_admin_delete" ON "public"."content_comment"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin() OR (user_id IN ( SELECT u.user_id
   FROM public."user" u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "content_comment_read" ON "public"."content_comment"
  FOR SELECT
  TO PUBLIC
  USING ((lower(status) = 'active'::text OR public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

CREATE POLICY "content_comment_owner_insert" ON "public"."content_comment"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id IN ( SELECT u.user_id
   FROM public."user" u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))) AND ((member_profile_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.member_profile profile
  WHERE ((profile.member_profile_id = content_comment.member_profile_id) AND (profile.user_id = content_comment.user_id) AND profile.is_active))))));

CREATE POLICY "content_comment_admin_update" ON "public"."content_comment"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()))
  WITH CHECK ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

CREATE POLICY "content_comment_owner_update" ON "public"."content_comment"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id IN (SELECT u.user_id FROM public."user" u WHERE u.auth_user_id = (SELECT auth.uid()))))
  WITH CHECK ((user_id IN (SELECT u.user_id FROM public."user" u WHERE u.auth_user_id = (SELECT auth.uid()))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."content_comment" TO "anon", "authenticated", "postgres", "service_role";
