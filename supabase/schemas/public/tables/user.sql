CREATE TABLE "public"."user" (
  "user_id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subscription_id"  bigint,
  "first_name"       character varying(100)   NOT NULL,
  "last_name"        character varying(100)   NOT NULL,
  "username"         character varying(100)   NOT NULL,
  "avatar_image"     text,
  "email"            character varying(255)   NOT NULL,
  "password"         character varying,
  "date_of_birth"    date,
  "payment_date"     timestamp with time zone,
  "payment_amount"   numeric(10,2),
  "payment_method"   character varying(50),
  "reference_number" character varying(100),
  "end_date"         timestamp with time zone,
  "user_role"        character varying(50)    NOT NULL,
  "account_status"   character varying(30)    NOT NULL DEFAULT 'Active',
  "joined_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "auth_user_id"     uuid,
  "stripe_customer_id" text,
  CONSTRAINT "app_user_email_key" UNIQUE (email),
  CONSTRAINT "app_user_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "app_user_username_key" UNIQUE (username),
  CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "user_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.subscription(subscription_id) ON UPDATE CASCADE ON DELETE SET NULL
);

ALTER TABLE "public"."user"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX app_user_auth_user_id_key ON public."user" USING btree (auth_user_id)
  WHERE (auth_user_id IS NOT NULL);

CREATE UNIQUE INDEX app_user_email_normalized_key ON public."user" USING btree (lower((email)::text));

CREATE UNIQUE INDEX user_stripe_customer_id_key ON public."user" USING btree (stripe_customer_id)
  WHERE (stripe_customer_id IS NOT NULL);

CREATE INDEX idx_user_auth_user_id ON public."user" USING btree (auth_user_id);

CREATE INDEX idx_user_subscription_id ON public."user" USING btree (subscription_id);

CREATE TRIGGER trigger_route_user_by_role
  AFTER INSERT ON public."user"
  FOR EACH ROW
  EXECUTE FUNCTION public.route_user_by_role();

CREATE TRIGGER trigger_protect_user_authorization_fields
  BEFORE UPDATE OF user_role, account_status, auth_user_id ON public."user"
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_authorization_fields();

CREATE POLICY "allow_select_user" ON "public"."user"
  FOR SELECT
  TO "authenticated"
  USING (((auth_user_id = ( SELECT auth.uid() AS uid)) OR public.is_any_admin()));

CREATE POLICY "allow_update_user" ON "public"."user"
  FOR UPDATE
  TO "authenticated"
  USING (((auth_user_id = ( SELECT auth.uid() AS uid)) OR public.is_any_admin()))
  WITH CHECK (((auth_user_id = ( SELECT auth.uid() AS uid)) OR public.is_any_admin()));

CREATE POLICY "master_admin_delete_user" ON "public"."user"
  FOR DELETE
  TO "authenticated"
  USING (public.is_master_admin());

CREATE POLICY "master_admin_insert_user" ON "public"."user"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_master_admin());

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user" TO "anon", "authenticated", "postgres", "service_role";
