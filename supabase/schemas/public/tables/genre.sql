CREATE TABLE "public"."genre" (
  "genre_id"    bigint                 GENERATED ALWAYS AS IDENTITY NOT NULL,
  "genre_name"  character varying(100) NOT NULL,
  "description" text,
  CONSTRAINT "genre_genre_name_key" UNIQUE (genre_name),
  CONSTRAINT "genre_pkey" PRIMARY KEY (genre_id)
);

ALTER TABLE "public"."genre"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_view_genre" ON "public"."genre"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "content_manager_delete_genre" ON "public"."genre"
  FOR DELETE
  TO "authenticated"
  USING (public.is_any_admin());

CREATE POLICY "content_manager_insert_genre" ON "public"."genre"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_any_admin());

CREATE POLICY "content_manager_update_genre" ON "public"."genre"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_any_admin())
  WITH CHECK (public.is_any_admin());

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."genre" TO "anon", "authenticated", "postgres", "service_role";
