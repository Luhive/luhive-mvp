-- Migration: Create event_collaborations table and add registration_source_community_id to event_registrations
-- Run this migration in your Supabase SQL Editor or via CLI

-- Create the event_collaborations table
CREATE TABLE IF NOT EXISTS public.event_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'co-host')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, community_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_collaborations_event_id ON public.event_collaborations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_collaborations_community_id ON public.event_collaborations(community_id);
CREATE INDEX IF NOT EXISTS idx_event_collaborations_status ON public.event_collaborations(status);

-- Add registration_source_community_id to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS registration_source_community_id UUID REFERENCES public.communities(id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_source_community ON public.event_registrations(registration_source_community_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_event_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_event_collaborations_updated_at ON public.event_collaborations;
CREATE TRIGGER trigger_update_event_collaborations_updated_at
  BEFORE UPDATE ON public.event_collaborations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_collaborations_updated_at();

-- Enable Row Level Security
ALTER TABLE public.event_collaborations ENABLE ROW LEVEL SECURITY;

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

-- Grant necessary permissions
GRANT ALL ON public.event_collaborations TO authenticated;
GRANT ALL ON public.event_collaborations TO service_role;

-- Migration: Create host collaboration records for existing events
-- This ensures all existing events have a host collaboration record
INSERT INTO public.event_collaborations (event_id, community_id, role, status, invited_by, invited_at, accepted_at)
SELECT 
  e.id as event_id,
  e.community_id,
  'host' as role,
  'accepted' as status,
  e.created_by as invited_by,
  e.created_at as invited_at,
  e.created_at as accepted_at
FROM public.events e
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_collaborations ec
  WHERE ec.event_id = e.id
  AND ec.community_id = e.community_id
  AND ec.role = 'host'
)
ON CONFLICT (event_id, community_id) DO NOTHING;
