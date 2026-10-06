create policy user_manager_delete_subscription
on public.subscription
for delete
to authenticated
using (public.is_admin_role('userManager'::character varying));

create policy user_manager_insert_subscription
on public.subscription
for insert
to authenticated
with check (public.is_admin_role('userManager'::character varying));

create policy user_manager_update_subscription
on public.subscription
for update
to authenticated
using (public.is_admin_role('userManager'::character varying))
with check (public.is_admin_role('userManager'::character varying));
