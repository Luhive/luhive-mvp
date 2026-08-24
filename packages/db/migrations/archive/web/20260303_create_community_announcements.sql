CREATE TABLE community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  published BOOLEAN NOT NULL DEFAULT TRUE,
  email_sent_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE community_announcement_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES community_announcements(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_community_published_created_at
ON community_announcements (community_id, published, created_at DESC);

CREATE INDEX idx_announcement_images_announcement_order
ON community_announcement_images (announcement_id, sort_order ASC);

CREATE OR REPLACE FUNCTION set_community_announcement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_community_announcement_updated_at
BEFORE UPDATE ON community_announcements
FOR EACH ROW
EXECUTE FUNCTION set_community_announcement_updated_at();

ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcement_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published announcements"
ON community_announcements
FOR SELECT
USING (published = TRUE);

CREATE POLICY "Public can view announcement images"
ON community_announcement_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM community_announcements ca
    WHERE ca.id = community_announcement_images.announcement_id
    AND ca.published = TRUE
  )
);

CREATE POLICY "Community owner/admin can insert announcements"
ON community_announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM communities c
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = community_announcements.community_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);

CREATE POLICY "Community owner/admin can update announcements"
ON community_announcements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM communities c
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = community_announcements.community_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM communities c
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = community_announcements.community_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);

CREATE POLICY "Community owner/admin can delete announcements"
ON community_announcements
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM communities c
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = community_announcements.community_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);

CREATE POLICY "Community owner/admin can insert announcement images"
ON community_announcement_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM community_announcements ca
    JOIN communities c ON c.id = ca.community_id
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE ca.id = community_announcement_images.announcement_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);

CREATE POLICY "Community owner/admin can update announcement images"
ON community_announcement_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM community_announcements ca
    JOIN communities c ON c.id = ca.community_id
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE ca.id = community_announcement_images.announcement_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM community_announcements ca
    JOIN communities c ON c.id = ca.community_id
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE ca.id = community_announcement_images.announcement_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);

CREATE POLICY "Community owner/admin can delete announcement images"
ON community_announcement_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM community_announcements ca
    JOIN communities c ON c.id = ca.community_id
    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
    WHERE ca.id = community_announcement_images.announcement_id
      AND (
        c.created_by = auth.uid()
        OR cm.role IN ('owner', 'admin')
      )
  )
);
