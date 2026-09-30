-- Hub directory counts. Counting membership and event rows in the app downloads
-- every row, and PostgREST stops at 1000, so communities past that cutoff show 0.
-- This view returns one row per visible community with the counts already done.

CREATE OR REPLACE VIEW public.hub_communities
WITH (security_invoker = true) AS
SELECT
  c.*,
  COALESCE(members.member_count, 0)::integer AS member_count,
  (
    COALESCE(hosted.hosted_event_count, 0)
    + COALESCE(cohosted.cohost_event_count, 0)
  )::integer AS event_count
FROM public.communities c
LEFT JOIN (
  SELECT community_id, count(*) AS member_count
  FROM public.community_members
  GROUP BY community_id
) members ON members.community_id = c.id
LEFT JOIN (
  SELECT community_id, count(*) AS hosted_event_count
  FROM public.events
  WHERE status = 'published'
  GROUP BY community_id
) hosted ON hosted.community_id = c.id
LEFT JOIN (
  SELECT ec.community_id, count(*) AS cohost_event_count
  FROM public.event_collaborations ec
  JOIN public.events e ON e.id = ec.event_id
  WHERE ec.status = 'accepted'
    AND ec.role = 'co-host'
    AND e.status = 'published'
    AND e.community_id <> ec.community_id
  GROUP BY ec.community_id
) cohosted ON cohosted.community_id = c.id
WHERE c.is_show = true;

COMMENT ON VIEW public.hub_communities IS
  'Visible communities for the hub, with member and published-event counts. Event count includes accepted co-hosted events.';

GRANT SELECT ON public.hub_communities TO anon, authenticated, service_role;
