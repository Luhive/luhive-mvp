-- Fix RLS policies to allow service role and web client tracking

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can insert their own announcement views" ON announcement_views;

-- Allow authenticated users to insert their own views
CREATE POLICY "Authenticated users can insert their own announcement views"
  ON announcement_views FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Allow anonymous web views via session
CREATE POLICY "Anonymous views with session id"
  ON announcement_views FOR INSERT
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Allow service role to insert (for email webhooks)
-- Service role has no auth context, so we just check the announcement exists
CREATE POLICY "Service role can insert email views"
  ON announcement_views FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM community_announcements WHERE id = announcement_id) > 0
  );

-- Keep existing read policy
DROP POLICY IF EXISTS "Anyone can read announcement view stats" ON announcement_views;
CREATE POLICY "Anyone can read announcement view stats"
  ON announcement_views FOR SELECT
  USING (TRUE);
