CREATE TABLE "public"."category" (
  "category_id"   bigint                 GENERATED ALWAYS AS IDENTITY NOT NULL,
  "category_name" character varying(100) NOT NULL,
  "description"   text,
  CONSTRAINT "category_category_name_key" UNIQUE (category_name),
  CONSTRAINT "category_pkey" PRIMARY KEY (category_id)
);

ALTER TABLE "public"."category"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_view_category" ON "public"."category"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "content_manager_delete_category" ON "public"."category"
  FOR DELETE
  TO "authenticated"
  USING (public.is_any_admin());

CREATE POLICY "content_manager_insert_category" ON "public"."category"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_any_admin());

CREATE POLICY "content_manager_update_category" ON "public"."category"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_any_admin())
  WITH CHECK (public.is_any_admin());

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."category" TO "anon", "authenticated", "postgres", "service_role";
