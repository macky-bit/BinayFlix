create or replace function public.record_my_watch_progress(
  selected_content_id bigint,
  selected_last_playback integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer_user_id public."user".user_id%type;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if selected_content_id is null or selected_last_playback is null or selected_last_playback < 0 then
    raise exception 'Invalid watch progress';
  end if;

  select account.user_id
    into viewer_user_id
  from public."user" as account
  where account.auth_user_id = auth.uid()
  limit 1;

  if viewer_user_id is null then
    raise exception 'StreamFlix user not found';
  end if;

  if not exists (
    select 1
    from public.content
    where content.content_id = selected_content_id
  ) then
    raise exception 'Content not found';
  end if;

  update public.watch_history
  set
    watch_date = now(),
    last_playback = selected_last_playback
  where user_id = viewer_user_id
    and content_id = selected_content_id;

  if not found then
    insert into public.watch_history (
      user_id,
      content_id,
      watch_date,
      last_playback
    )
    values (
      viewer_user_id,
      selected_content_id,
      now(),
      selected_last_playback
    );
  end if;
end;
$$;

revoke all on function public.record_my_watch_progress(bigint, integer) from public;
grant execute on function public.record_my_watch_progress(bigint, integer) to authenticated;
