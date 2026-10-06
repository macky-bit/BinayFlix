CREATE TABLE "public"."subscription" (
  "subscription_id"  bigint                 GENERATED ALWAYS AS IDENTITY NOT NULL,
  "plan_name"        character varying(100) NOT NULL,
  "monthly_price"    numeric(10,2)          NOT NULL,
  "max_user"         integer                NOT NULL,
  "plan_description" text,
  CONSTRAINT "subscription_max_user_check" CHECK ((max_user > 0)),
  CONSTRAINT "subscription_monthly_price_check" CHECK ((monthly_price >= (0)::numeric)),
  CONSTRAINT "subscription_pkey" PRIMARY KEY (subscription_id)
);

ALTER TABLE "public"."subscription"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_view_subscription_plans" ON "public"."subscription"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "master_admin_delete_subscription" ON "public"."subscription"
  FOR DELETE
  TO "authenticated"
  USING (public.is_master_admin());

CREATE POLICY "master_admin_insert_subscription" ON "public"."subscription"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_master_admin());

CREATE POLICY "master_admin_update_subscription" ON "public"."subscription"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

CREATE POLICY "user_manager_delete_subscription" ON "public"."subscription"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin_role('userManager'::character varying));

CREATE POLICY "user_manager_insert_subscription" ON "public"."subscription"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin_role('userManager'::character varying));

CREATE POLICY "user_manager_update_subscription" ON "public"."subscription"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin_role('userManager'::character varying))
  WITH CHECK (public.is_admin_role('userManager'::character varying));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription" TO "anon", "authenticated", "postgres", "service_role";
