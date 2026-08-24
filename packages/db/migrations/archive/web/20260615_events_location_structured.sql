-- Add structured location columns to events for Google Maps integration.
-- All columns are nullable to preserve backward compatibility with existing events.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_place_id text;

COMMENT ON COLUMN events.location_name IS 'Venue display name from Google Places (e.g. "United Coffee Beans")';
COMMENT ON COLUMN events.location_lat IS 'Latitude from Google Places';
COMMENT ON COLUMN events.location_lng IS 'Longitude from Google Places';
COMMENT ON COLUMN events.location_place_id IS 'Google Places place_id for building Maps/embed/directions URLs';
