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
