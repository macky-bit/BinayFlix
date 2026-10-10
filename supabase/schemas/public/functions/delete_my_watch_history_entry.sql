create or replace function public.delete_my_watch_history_entry(
  selected_content_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from public.watch_history as history
  using public."user" as account
  where history.content_id = selected_content_id
    and history.user_id = account.user_id
    and account.auth_user_id = auth.uid();
end;
$$;

revoke all on function public.delete_my_watch_history_entry(bigint) from public;
grant execute on function public.delete_my_watch_history_entry(bigint) to authenticated;
