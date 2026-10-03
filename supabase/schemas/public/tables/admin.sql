CREATE TABLE "public"."admin" (
  "auth_user_id" uuid,
  "admin_id"     uuid              NOT NULL DEFAULT gen_random_uuid(),
  "full_name"    character varying NOT NULL,
  "email"        character varying NOT NULL,
  "username"     character varying NOT NULL,
  "password"     character varying NOT NULL,
  "role"         character varying NOT NULL,
  CONSTRAINT "admin_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "admin_email_key" UNIQUE (email),
  CONSTRAINT "admin_pkey" PRIMARY KEY (admin_id),
  CONSTRAINT "admin_username_key" UNIQUE (username)
);

ALTER TABLE "public"."admin"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX admin_auth_user_id_idx ON public.admin USING btree (auth_user_id);

CREATE POLICY "allow_admin_and_master_select" ON "public"."admin"
  FOR SELECT
  TO "authenticated"
  USING (((auth_user_id = ( SELECT auth.uid() AS uid)) OR public.is_master_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admin" TO "anon", "authenticated", "postgres", "service_role";
