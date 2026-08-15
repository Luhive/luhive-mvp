ALTER TABLE announcement_views
ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_announcement_views_session
  ON announcement_views (announcement_id, session_id)
  WHERE session_id IS NOT NULL;
