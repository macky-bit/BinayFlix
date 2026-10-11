begin;

alter table public.content
  add column if not exists created_at timestamptz,
  add column if not exists admin_updated_at timestamptz;

alter table public.content
  alter column created_at set default now();

create index if not exists content_admin_updated_at_idx
  on public.content (admin_updated_at desc)
  where admin_updated_at is not null;

create or replace function public.set_admin_content_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and public.is_any_admin() then
    new.admin_updated_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.set_admin_content_updated_at() from public, anon, authenticated;

drop trigger if exists set_admin_content_updated_at on public.content;
create trigger set_admin_content_updated_at
before insert or update on public.content
for each row execute function public.set_admin_content_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'content'
  ) then
    alter publication supabase_realtime add table public.content;
  end if;
end
$$;

commit;
