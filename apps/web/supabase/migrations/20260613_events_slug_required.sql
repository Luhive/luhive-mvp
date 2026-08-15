-- Backfill event slugs, enforce NOT NULL, and unique per community.

CREATE OR REPLACE FUNCTION public.slugify_event_title(title text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
  base_slug text;
BEGIN
  s := trim(title);

  IF s IS NULL OR s = '' THEN
    RETURN NULL;
  END IF;

  -- Azerbaijani case folding before generic lower()
  s := replace(s, 'İ', 'i');
  s := replace(s, 'I', 'ı');
  s := lower(s);

  -- Transliterate AZ-specific letters to ASCII
  s := translate(s, 'əğıöüşç', 'egiousc');

  base_slug := regexp_replace(
    regexp_replace(s, '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  );
  base_slug := left(base_slug, 60);

  IF base_slug IS NULL OR base_slug = '' THEN
    RETURN NULL;
  END IF;

  IF base_slug IN ('events', 'announcements') THEN
    base_slug := base_slug || '-event';
  END IF;

  RETURN base_slug;
END;
$$;

DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INT;
BEGIN
  FOR r IN
    SELECT id, community_id, title
    FROM events
    WHERE slug IS NULL
    ORDER BY created_at ASC
  LOOP
    base_slug := slugify_event_title(r.title);

    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'event-' || left(r.id::text, 8);
    END IF;

    final_slug := base_slug;
    counter := 2;

    WHILE EXISTS (
      SELECT 1
      FROM events
      WHERE community_id = r.community_id
        AND slug = final_slug
        AND id <> r.id
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE events SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE events ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS events_community_id_slug_key
  ON events (community_id, slug);
