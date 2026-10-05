-- Hub event directory. Event pages are addressed by community slug + event slug,
-- so the hub needs each published event joined to its visible host community.
-- Keeping the filter here means the hub never lists events from hidden
-- communities, whichever client reads it.

CREATE OR REPLACE VIEW public.hub_events
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.slug,
  e.title,
  e.cover_url,
  e.start_time,
  e.end_time,
  e.timezone,
  e.event_type,
  e.location_name,
  e.location_address,
  c.id AS community_id,
  c.slug AS community_slug,
  c.name AS community_name
FROM public.events e
JOIN public.communities c ON c.id = e.community_id
WHERE e.status = 'published'
  AND c.is_show = true;

COMMENT ON VIEW public.hub_events IS
  'Published events hosted by visible communities, with the host community slug and name for hub links.';

GRANT SELECT ON public.hub_events TO anon, authenticated, service_role;
