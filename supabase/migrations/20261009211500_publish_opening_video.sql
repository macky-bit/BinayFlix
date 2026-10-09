insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'streamflix-media',
  'streamflix-media',
  true,
  52428800,
  array['video/mp4']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists authenticated_can_read_streamflix_opening
  on storage.objects;
