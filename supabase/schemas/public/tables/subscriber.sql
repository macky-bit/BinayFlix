CREATE TABLE "public"."subscriber" (
  "subscriber_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid NOT NULL,
  CONSTRAINT "subscriber_pkey" PRIMARY KEY (subscriber_id),
  CONSTRAINT "subscriber_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."subscriber"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriber_user_id ON public.subscriber USING btree (user_id);

CREATE POLICY "user_manager_full_subscriber_control" ON "public"."subscriber"
  FOR ALL
  TO PUBLIC
  USING ((public.is_admin_role('userManager'::character varying) OR public.is_master_admin()))
  WITH CHECK ((public.is_admin_role('userManager'::character varying) OR public.is_master_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscriber" TO "anon", "authenticated", "postgres", "service_role";
