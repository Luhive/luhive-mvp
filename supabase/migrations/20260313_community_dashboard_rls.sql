-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: community_visits — community creator / owner / admin can SELECT
-- ─────────────────────────────────────────────────────────────────────────────

-- Make sure RLS is enabled on the table
ALTER TABLE public.community_visits ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists so we can recreate cleanly
DROP POLICY IF EXISTS "Community admins can view community visits" ON public.community_visits;

CREATE POLICY "Community admins can view community visits"
  ON public.community_visits
  FOR SELECT
  USING (
    -- 1. The user created the community
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_visits.community_id
        AND c.created_by = auth.uid()
    )
    OR
    -- 2. The user is an owner or admin member of the community
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_visits.community_id
        AND cm.user_id    = auth.uid()
        AND cm.role       IN ('owner', 'admin')
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: community_members — community creator / owner / admin can SELECT
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community admins can view community members" ON public.community_members;

CREATE POLICY "Community admins can view community members"
  ON public.community_members
  FOR SELECT
  USING (
    -- 1. The user created the community
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_members.community_id
        AND c.created_by = auth.uid()
    )
    OR
    -- 2. The user is an owner or admin of that community
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id      = auth.uid()
        AND cm.role         IN ('owner', 'admin')
    )
    OR
    -- 3. A member can always see their own row
    user_id = auth.uid()
  );
