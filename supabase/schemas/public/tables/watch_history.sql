CREATE TABLE "public"."watch_history" (
  "content_id"    bigint                      NOT NULL,
  "watch_date"    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_playback" integer,
  "user_id"       uuid                        NOT NULL,
  CONSTRAINT "watch_history_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(content_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "watch_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."watch_history"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_watch_history_content_id ON public.watch_history USING btree (content_id);

CREATE INDEX idx_watch_history_user_id ON public.watch_history USING btree (user_id);

CREATE POLICY "user_manager_can_view_watch_history" ON "public"."watch_history"
  FOR SELECT
  TO PUBLIC
  USING ((public.is_admin_role('userManager'::character varying) OR public.is_master_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."watch_history" TO "anon", "authenticated", "postgres", "service_role";
