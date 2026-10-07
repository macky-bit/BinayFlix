CREATE TABLE "public"."reaction" (
  "content_id" bigint NOT NULL,
  "emoji"      text,
  "user_id"    uuid   NOT NULL,
  "status"     character varying(30) NOT NULL DEFAULT 'Active',
  CONSTRAINT "reaction_content_user_unique" UNIQUE (content_id, user_id),
  CONSTRAINT "reaction_status_check" CHECK ((status)::text = ANY ((ARRAY['Active'::character varying, 'Hidden'::character varying])::text[])),
  CONSTRAINT "reaction_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "reaction_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."reaction"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reaction_content_id ON public.reaction USING btree (content_id);

CREATE INDEX idx_reaction_user_id ON public.reaction USING btree (user_id);

CREATE POLICY "anyone_can_read_reactions" ON "public"."reaction"
  FOR SELECT
  TO PUBLIC
  USING (((status)::text = 'Active'::text OR public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

CREATE POLICY "reaction_admin_update" ON "public"."reaction"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()))
  WITH CHECK ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

CREATE POLICY "reaction_owner_insert" ON "public"."reaction"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id IN (SELECT u.user_id FROM public."user" u WHERE u.auth_user_id = (SELECT auth.uid()))));

CREATE POLICY "reaction_owner_delete" ON "public"."reaction"
  FOR DELETE
  TO "authenticated"
  USING ((user_id IN (SELECT u.user_id FROM public."user" u WHERE u.auth_user_id = (SELECT auth.uid()))));

CREATE POLICY "comment_manager_can_delete_reactions" ON "public"."reaction"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_admin_role('commentManager'::character varying) OR public.is_master_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reaction" TO "anon", "authenticated", "postgres", "service_role";
