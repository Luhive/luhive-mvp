-- Fix RLS policies for event_collaborations
-- Drop existing policies
DROP POLICY IF EXISTS "Community owners can invite collaborations" ON public.event_collaborations;
DROP POLICY IF EXISTS "Users can view collaborations for their communities" ON public.event_collaborations;
DROP POLICY IF EXISTS "Community owners can update their collaborations" ON public.event_collaborations;
DROP POLICY IF EXISTS "Host community can remove collaborations" ON public.event_collaborations;

-- Policy: Users can view collaborations for events in their communities
-- Allow viewing if user is member of host or co-host community
CREATE POLICY "Users can view collaborations for their communities"
  ON public.event_collaborations
  FOR SELECT
  USING (
    -- User is owner/admin of the collaboration's community (co-host)
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = event_collaborations.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'owner' OR cm.role = 'admin')
    )
    -- OR user is creator of the collaboration's community
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = event_collaborations.community_id
      AND c.created_by = auth.uid()
    )
    -- OR user is owner/admin of the host community (event's community_id)
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_collaborations.event_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'owner' OR cm.role = 'admin')
    )
    -- OR user is creator of the host community
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.communities c ON c.id = e.community_id
      WHERE e.id = event_collaborations.event_id
      AND c.created_by = auth.uid()
    )
    -- OR user is creator of the event
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_collaborations.event_id
      AND e.created_by = auth.uid()
    )
  );

-- Policy: Host community owners/admins can invite collaborations
CREATE POLICY "Community owners can invite collaborations"
  ON public.event_collaborations
  FOR INSERT
  WITH CHECK (
    -- User must be the one inviting
    event_collaborations.invited_by = auth.uid()
    AND (
      -- User is owner/admin of the host community (event's community_id)
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.community_members cm ON cm.community_id = e.community_id
        WHERE e.id = event_collaborations.event_id
        AND cm.user_id = auth.uid()
        AND (cm.role = 'owner' OR cm.role = 'admin')
      )
      -- OR user is creator of the host community
      OR EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.communities c ON c.id = e.community_id
        WHERE e.id = event_collaborations.event_id
        AND c.created_by = auth.uid()
      )
      -- OR user is creator of the event
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_collaborations.event_id
        AND e.created_by = auth.uid()
      )
    )
  );

-- Policy: Community owners can accept/reject collaborations
CREATE POLICY "Community owners can update their collaborations"
  ON public.event_collaborations
  FOR UPDATE
  USING (
    -- User is owner/admin of the collaboration's community
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = event_collaborations.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'owner' OR cm.role = 'admin')
    )
    -- OR user is creator of the collaboration's community
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = event_collaborations.community_id
      AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = event_collaborations.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'owner' OR cm.role = 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = event_collaborations.community_id
      AND c.created_by = auth.uid()
    )
  );

-- Policy: Host community can remove collaborations
CREATE POLICY "Host community can remove collaborations"
  ON public.event_collaborations
  FOR DELETE
  USING (
    -- User is owner/admin of the host community
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_collaborations.event_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'owner' OR cm.role = 'admin')
    )
    -- OR user is creator of the host community
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.communities c ON c.id = e.community_id
      WHERE e.id = event_collaborations.event_id
      AND c.created_by = auth.uid()
    )
    -- OR user is creator of the event
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_collaborations.event_id
      AND e.created_by = auth.uid()
    )
  );
