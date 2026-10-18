CREATE OR REPLACE FUNCTION public.create_admin_content_draft(
  p_content jsonb,
  p_genre_ids bigint[] DEFAULT ARRAY[]::bigint[]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_content_id bigint;
  genre_id bigint;
BEGIN
  IF NOT public.is_any_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF btrim(COALESCE(p_content->>'title', '')) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  INSERT INTO public.content (
    category_id, title, synopsis, release_year, runtime, age_rating,
    availability_status, tmdb_id, catalog_source, publishing_status
  ) VALUES (
    NULLIF(p_content->>'category_id', '')::bigint,
    left(btrim(p_content->>'title'), 255),
    p_content->>'synopsis',
    NULLIF(p_content->>'release_year', '')::integer,
    NULLIF(p_content->>'runtime', '')::integer,
    left(COALESCE(p_content->>'age_rating', ''), 20),
    'unavailable',
    NULL,
    'manual',
    'uploading'
  )
  RETURNING content_id INTO new_content_id;

  FOREACH genre_id IN ARRAY COALESCE(p_genre_ids, ARRAY[]::bigint[]) LOOP
    INSERT INTO public.content_genre (content_id, genre_id)
    VALUES (new_content_id, genre_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN new_content_id;
END;
$$;

UPDATE public.content
SET tmdb_id = NULL
WHERE catalog_source = 'manual'
  AND tmdb_id IS NOT NULL;

ALTER TABLE public.content
  DROP CONSTRAINT IF EXISTS manual_content_has_no_tmdb_reference;

ALTER TABLE public.content
  ADD CONSTRAINT manual_content_has_no_tmdb_reference
  CHECK (catalog_source <> 'manual' OR tmdb_id IS NULL);
