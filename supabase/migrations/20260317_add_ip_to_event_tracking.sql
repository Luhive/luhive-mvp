-- Add IP address fields for analytics tables

ALTER TABLE public.event_visits
  ADD COLUMN IF NOT EXISTS ip text NULL;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS registration_ip text NULL;

CREATE INDEX IF NOT EXISTS idx_event_visits_event_ip
  ON public.event_visits(event_id, ip);

