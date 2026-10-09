-- Curated from the YouTube Data API discovery report generated on 2026-10-10.
-- Only high-confidence soundtrack/theme matches from official labels, official
-- show channels, or artist Topic channels are retained. YouTube watch pages are
-- references and intentionally remain separate from direct audio stream links.
with discovered (content_id, song_title, track_title, artist, external_url) as (
  values
    (1, 'Suite New Day', 'Suite New Day from Spider-Man: Brand New Day', 'SonySoundtracksVEVO', 'https://www.youtube.com/watch?v=YpFweSMfEYs'),
    (5, 'Atoms Humming', 'The Love Hypothesis (Original Motion Picture Soundtrack)', 'Lakeshore Records', 'https://www.youtube.com/watch?v=zK8C6Bgcd-w'),
    (6, 'Coyote vs. Acme Soundtrack', 'Full Album - Steven Price', 'WaterTower Music', 'https://www.youtube.com/watch?v=L5aORV29-h4'),
    (19, 'Opening', 'Resident Evil: Welcome to Raccoon City (Original Motion Picture Soundtrack)', 'SonySoundtracksVEVO', 'https://www.youtube.com/watch?v=ByfY61liVtY'),
    (23, 'Portals', 'Avengers: Endgame', 'MarvelMusicVEVO', 'https://www.youtube.com/watch?v=F_mhWxOjxp4'),
    (40, 'Mga Kababayan', 'Forgotten Island', 'Back Lot Music', 'https://www.youtube.com/watch?v=rmzjFG29P9c'),
    (45, 'Bottle Up', 'PAW Patrol: The Dino Movie', 'Nick Jr.', 'https://www.youtube.com/watch?v=kuddYB2OHEQ'),
    (46, 'Rosebush Pruning Main Theme', 'Rosebush Pruning Main Theme', 'Herbert - Topic', 'https://www.youtube.com/watch?v=7669ojpU-AU'),
    (47, 'Vibe Venuma', 'Meesaya Murukku 2', 'Hiphop Tamizha - Topic', 'https://www.youtube.com/watch?v=q2oxK0bsoKs'),
    (49, 'Opening Theme', 'Let Us Prey', 'Steve Lynch - Topic', 'https://www.youtube.com/watch?v=pZvUg0gv7W0'),
    (52, 'Main Theme (Reprise)', 'The Scandal', 'Lee Jiyeon - Topic', 'https://www.youtube.com/watch?v=0M43Eybjltw'),
    (53, 'Reacher Preps', 'Music from Reacher', 'Paramount Music', 'https://www.youtube.com/watch?v=NW9a6Ff0PnU'),
    (55, 'The Office Main Theme', 'The Office Main Theme', 'The Office Band - Topic', 'https://www.youtube.com/watch?v=0T-if-Vj2Xs'),
    (59, 'Main Title Theme', 'The Mentalist (Extended Version)', 'Blake Neely - Topic', 'https://www.youtube.com/watch?v=NoP6vHcYJ4w'),
    (60, 'The Simpsons Main Title Theme', 'The Simpsons Main Title Theme', 'The Simpsons - Topic', 'https://www.youtube.com/watch?v=Fttst9dG6Ko'),
    (62, 'Opening Credits', 'The Late Show with Stephen Colbert', 'The Late Show with Stephen Colbert', 'https://www.youtube.com/watch?v=aPIf3YMiUwc'),
    (68, 'NCIS Theme', 'NCIS Theme', 'Release - Topic', 'https://www.youtube.com/watch?v=b57XMgf7B7I'),
    (71, 'Family Guy Main Title', 'Family Guy Main Title', 'Cast - Family Guy - Topic', 'https://www.youtube.com/watch?v=VileKLJz6tQ'),
    (83, 'Main Title', 'Game of Thrones: Season 7', 'Ramin Djawadi - Topic', 'https://www.youtube.com/watch?v=tn4OGbPaPns'),
    (84, 'Good Morning U.S.A.', 'American Dad! Main Title Theme', 'American Dad! Cast - Topic', 'https://www.youtube.com/watch?v=RoUe1vlRb6Q'),
    (86, 'In Brightest Day, In Blackest Night', 'Lanterns Theme', 'WaterTower Music', 'https://www.youtube.com/watch?v=BnwTh4TZnhc'),
    (90, 'Ted Lasso Theme', 'Ted Lasso Theme', 'WaterTower Music', 'https://www.youtube.com/watch?v=AIcis7S-byg'),
    (92, 'Bones Theme', 'Bones 2012 Extended Mix', 'The Crystal Method - Topic', 'https://www.youtube.com/watch?v=trmaxIG-1bE'),
    (99, 'Breaking Bad Main Title Theme', 'Breaking Bad Main Title Theme (Extended)', 'Dave Porter - Topic', 'https://www.youtube.com/watch?v=ilfYnhXD-bE'),
    (100, 'Silo Main Title', 'Silo Main Title', 'Atli Orvarsson - Topic', 'https://www.youtube.com/watch?v=LEoLro2TlIM')
)
insert into public.soundtrack (
  content_id,
  song_title,
  track_title,
  artist,
  external_url,
  stream_link
)
select
  discovered.content_id,
  discovered.song_title,
  discovered.track_title,
  discovered.artist,
  discovered.external_url,
  null
from discovered
where not exists (
  select 1
  from public.soundtrack existing
  where existing.content_id = discovered.content_id
    and existing.external_url = discovered.external_url
);
