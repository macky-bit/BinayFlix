BEGIN;

ALTER TABLE public.previous_film_refresher
  ADD COLUMN IF NOT EXISTS source_name varchar(50),
  ADD COLUMN IF NOT EXISTS source_title text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS key_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS important_characters jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS previous_film_refresher_wikipedia_cache_idx
  ON public.previous_film_refresher (content_id, source_updated_at DESC)
  WHERE source_name = 'Wikipedia';

COMMIT;
