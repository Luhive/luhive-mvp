-- Create announcement_views table to track email opens and web views
CREATE TABLE IF NOT EXISTS announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES community_announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  view_source TEXT NOT NULL CHECK (view_source IN ('email', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX idx_announcement_views_announcement_created ON announcement_views(announcement_id, created_at);
CREATE INDEX idx_announcement_views_source ON announcement_views(announcement_id, view_source);

-- Enable RLS
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert their own view
CREATE POLICY "Users can insert their own announcement views"
  ON announcement_views FOR INSERT
  WITH CHECK (auth.uid()::text = COALESCE(user_id::text, 'anonymous'));

-- RLS Policy: Anyone can read view counts (aggregated)
CREATE POLICY "Anyone can read announcement view stats"
  ON announcement_views FOR SELECT
  USING (TRUE);
