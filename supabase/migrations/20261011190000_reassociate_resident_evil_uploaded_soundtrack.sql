-- The uploaded TEST track was linked to the 2021 Resident Evil film (content 19),
-- while its audio and lyrics were intended for the 2026 Resident Evil title (content 2).
-- Match both catalog titles and the specific record so other soundtracks stay assigned.
UPDATE public.soundtrack AS track
SET content_id = target.content_id
FROM public.content AS target, public.content AS previous
WHERE track.soundtrack_id = 45
  AND track.song_title = 'TEST'
  AND track.content_id = previous.content_id
  AND previous.title = 'Resident Evil: Welcome to Raccoon City'
  AND target.title = 'Resident Evil'
  AND target.release_year = 2026
  AND track.stream_link IS NOT NULL
  AND track.lyrics IS NOT NULL;
