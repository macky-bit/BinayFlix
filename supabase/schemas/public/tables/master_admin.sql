CREATE TABLE "public"."master_admin" (
  "master_admin_id" uuid                   NOT NULL DEFAULT gen_random_uuid(),
  "full_name"       character varying(255) NOT NULL,
  "username"        character varying(100) NOT NULL,
  "email"           character varying(255) NOT NULL,
  "password"        character varying      NOT NULL,
  CONSTRAINT "master_admin_email_key" UNIQUE (email),
  CONSTRAINT "master_admin_pkey" PRIMARY KEY (master_admin_id),
  CONSTRAINT "master_admin_username_key" UNIQUE (username)
);

ALTER TABLE "public"."master_admin"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_admin_can_update_own_record" ON "public"."master_admin"
  FOR UPDATE
  TO PUBLIC
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

CREATE POLICY "master_admin_can_view_own_record" ON "public"."master_admin"
  FOR SELECT
  TO PUBLIC
  USING (public.is_master_admin());

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_admin" TO "anon", "authenticated", "postgres", "service_role";
