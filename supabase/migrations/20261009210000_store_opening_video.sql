insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'video_file',
  'video_file',
  false,
  array['video/mp4']
)
on conflict (id) do update
set public = false,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists authenticated_can_read_streamflix_opening
  on storage.objects;
create policy authenticated_can_read_streamflix_opening
on storage.objects for select to authenticated
using (
  bucket_id = 'video_file'
  and name = 'system/streamflix-opening.mp4'
);
