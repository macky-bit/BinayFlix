begin;

-- Prevent future functions from becoming browser-callable by default.
alter default privileges for role postgres
  revoke execute on functions from public;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- These are authenticated application RPCs. Keep their authenticated access,
-- but remove the accidental anonymous grant inherited from default privileges.
revoke all on function public.get_my_admin_access() from public, anon;
revoke all on function public.find_user_for_admin(uuid) from public, anon;
revoke all on function public.grant_admin_access(uuid, varchar) from public, anon;
revoke all on function public.set_admin_access_status(uuid, varchar) from public, anon;
revoke all on function public.set_admin_access_role(uuid, varchar) from public, anon;
revoke all on function public.update_admin_profile(uuid, varchar, varchar, varchar) from public, anon;
revoke all on function public.remove_admin_access(uuid) from public, anon;
revoke all on function public.select_subscription_plan(bigint) from public, anon;

grant execute on function public.get_my_admin_access() to authenticated, postgres, service_role;
grant execute on function public.find_user_for_admin(uuid) to authenticated, postgres, service_role;
grant execute on function public.grant_admin_access(uuid, varchar) to authenticated, postgres, service_role;
grant execute on function public.set_admin_access_status(uuid, varchar) to authenticated, postgres, service_role;
grant execute on function public.set_admin_access_role(uuid, varchar) to authenticated, postgres, service_role;
grant execute on function public.update_admin_profile(uuid, varchar, varchar, varchar) to authenticated, postgres, service_role;
grant execute on function public.remove_admin_access(uuid) to authenticated, postgres, service_role;
grant execute on function public.select_subscription_plan(bigint) to authenticated, postgres, service_role;

-- Trigger handlers are not RPCs. PostgreSQL invokes them through their
-- registered triggers without client EXECUTE privileges.
revoke all on function public.handle_auth_profile() from public, anon, authenticated;
revoke all on function public.handle_google_auth_user() from public, anon, authenticated;
revoke all on function public.handle_google_identity() from public, anon, authenticated;
revoke all on function public.sync_streamflix_account_email() from public, anon, authenticated;
revoke all on function public.route_user_by_role() from public, anon, authenticated;
revoke all on function public.set_member_profile_updated_at() from public, anon, authenticated;

grant execute on function public.handle_auth_profile() to postgres, service_role;
grant execute on function public.handle_google_auth_user() to postgres, service_role;
grant execute on function public.handle_google_identity() to postgres, service_role;
grant execute on function public.sync_streamflix_account_email() to postgres, service_role;
grant execute on function public.route_user_by_role() to postgres, service_role;
grant execute on function public.set_member_profile_updated_at() to postgres, service_role;

-- The diagnostic table is intentionally inaccessible to clients. An explicit
-- deny policy documents that choice and removes the no-policy advisor finding.
drop policy if exists deny_all_client_access on public.test;
create policy deny_all_client_access
  on public.test
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.test from anon, authenticated;

-- Owners may edit their profile, but authorization fields must only be changed
-- by an active administrator. This closes a direct self-promotion path in the
-- existing owner UPDATE policy without breaking normal profile edits.
create or replace function public.protect_user_authorization_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Auth synchronization runs inside trusted SECURITY DEFINER functions owned
  -- by postgres. service_role is likewise an explicitly trusted backend role.
  if current_user in ('postgres', 'service_role', 'supabase_auth_admin') then
    return new;
  end if;

  if new.user_role is distinct from old.user_role
    or new.auth_user_id is distinct from old.auth_user_id then
    if not public.is_master_admin() then
      raise exception 'Only a Master Admin may change account role or identity fields.'
        using errcode = '42501';
    end if;
  end if;

  if new.account_status is distinct from old.account_status
    and not public.is_any_admin() then
    raise exception 'Only an active administrator may change account status.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_user_authorization_fields()
  from public, anon, authenticated;
grant execute on function public.protect_user_authorization_fields()
  to postgres, service_role;

drop trigger if exists trigger_protect_user_authorization_fields on public."user";
create trigger trigger_protect_user_authorization_fields
  before update of user_role, account_status, auth_user_id on public."user"
  for each row
  execute function public.protect_user_authorization_fields();

commit;
