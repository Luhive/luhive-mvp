-- Event statistics foundation: visits + attribution + conversion timing

-- 1) Event page visits tracking table
CREATE TABLE IF NOT EXISTS public.event_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  utm_source text NULL,
  utm_medium text NULL,
  utm_campaign text NULL,
  utm_content text NULL,
  utm_term text NULL,
  referrer_url text NULL,
  referrer_domain text NULL,
  country text NULL,
  city text NULL,
  region text NULL,
  timezone text NULL,
  device_type text NULL,
  browser text NULL,
  os text NULL,
  is_mobile boolean NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_visits_event_visited_at
  ON public.event_visits(event_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_visits_event_session
  ON public.event_visits(event_id, session_id);

CREATE INDEX IF NOT EXISTS idx_event_visits_event_source
  ON public.event_visits(event_id, utm_source);

CREATE INDEX IF NOT EXISTS idx_event_visits_event_country_city
  ON public.event_visits(event_id, country, city);

-- 2) Event registrations attribution + conversion timing
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS utm_source text NULL,
  ADD COLUMN IF NOT EXISTS utm_medium text NULL,
  ADD COLUMN IF NOT EXISTS utm_campaign text NULL,
  ADD COLUMN IF NOT EXISTS utm_content text NULL,
  ADD COLUMN IF NOT EXISTS utm_term text NULL,
  ADD COLUMN IF NOT EXISTS registration_session_id text NULL,
  ADD COLUMN IF NOT EXISTS registration_country text NULL,
  ADD COLUMN IF NOT EXISTS registration_city text NULL,
  ADD COLUMN IF NOT EXISTS time_to_register_seconds integer NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_registered_at
  ON public.event_registrations(event_id, registered_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_source
  ON public.event_registrations(event_id, utm_source);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_session
  ON public.event_registrations(event_id, registration_session_id);

-- 3) RLS policies
ALTER TABLE public.event_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community admins can view event visits" ON public.event_visits;
CREATE POLICY "Community admins can view event visits"
  ON public.event_visits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.communities c
      WHERE c.id = event_visits.community_id
        AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.community_members cm
      WHERE cm.community_id = event_visits.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Anyone can insert event visits" ON public.event_visits;
CREATE POLICY "Anyone can insert event visits"
  ON public.event_visits
  FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL
    AND char_length(session_id) > 0
    AND (
      user_id IS NULL OR user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_visits.event_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.communities c
      WHERE c.id = event_visits.community_id
    )
  );
