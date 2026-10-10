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

create or replace function public.get_my_watch_history()
returns table (
  content_id bigint,
  title text,
  thumbnail text,
  watch_date timestamp without time zone,
  last_playback integer,
  runtime integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    history.content_id,
    catalog.title::text,
    catalog.thumbnail,
    history.watch_date,
    history.last_playback,
    catalog.runtime
  from public.watch_history as history
  join public.content as catalog
    on catalog.content_id = history.content_id
  join public."user" as account
    on account.user_id = history.user_id
  where account.auth_user_id = auth.uid()
  order by history.watch_date desc;
$$;

revoke all on function public.get_my_watch_history() from public;
grant execute on function public.get_my_watch_history() to authenticated;

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
