CREATE TABLE "public"."reaction" (
  "content_id" bigint NOT NULL,
  "emoji"      text,
  "user_id"    uuid   NOT NULL,
  CONSTRAINT "reaction_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "reaction_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."reaction"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reaction_content_id ON public.reaction USING btree (content_id);

CREATE INDEX idx_reaction_user_id ON public.reaction USING btree (user_id);

CREATE POLICY "comment_manager_can_view_reactions" ON "public"."reaction"
  FOR SELECT
  TO PUBLIC
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

CREATE POLICY "comment_manager_can_delete_reactions" ON "public"."reaction"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reaction" TO "anon", "authenticated", "postgres", "service_role";
