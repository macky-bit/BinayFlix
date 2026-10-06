revoke update on public.system_log from authenticated;

grant update (status) on public.system_log to authenticated;

create policy system_log_admin_update
on public.system_log
for update
to authenticated
using (public.is_admin_role('systemManager'))
with check (public.is_admin_role('systemManager'));
