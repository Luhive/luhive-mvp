-- Create enum for reminder time options
CREATE TYPE reminder_time AS ENUM ('1-hour', '3-hours', '1-day');

-- Create event_reminders table
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_times reminder_time[] NOT NULL DEFAULT ARRAY[]::reminder_time[], -- Array to store multiple selected times
  custom_message TEXT, -- Optional custom message; if null, use default
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_event_reminders UNIQUE(event_id)
);

-- Create sent_reminders table to track which reminders have been sent
CREATE TABLE sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  reminder_time reminder_time NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_email TEXT NOT NULL,
  
  -- Prevent duplicate sends for the same registration and reminder time
  CONSTRAINT unique_sent_reminder UNIQUE(registration_id, reminder_time)
);

-- Create index for efficient queries
CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_sent_reminders_event_id ON sent_reminders(event_id);
CREATE INDEX idx_sent_reminders_sent_at ON sent_reminders(sent_at);

-- Enable RLS on event_reminders
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_reminders
-- Allow users to view reminders for their community's events
CREATE POLICY "Users can view reminders for their community events"
  ON event_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_collaborations ec
      WHERE ec.event_id = event_reminders.event_id
      AND ec.community_id IN (
        SELECT cm.id FROM community_members cm
        WHERE cm.user_id = auth.uid()
      )
    )
  );

-- Allow host communities to update reminders
CREATE POLICY "Host communities can update reminders"
  ON event_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_collaborations ec
      WHERE ec.event_id = event_reminders.event_id
      AND ec.role = 'host'
      AND ec.status = 'accepted'
      AND ec.community_id IN (
        SELECT cm.id FROM community_members cm
        WHERE cm.user_id = auth.uid()
      )
    )
  );

-- Allow host communities to insert reminders
CREATE POLICY "Host communities can insert reminders"
  ON event_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_collaborations ec
      WHERE ec.event_id = event_reminders.event_id
      AND ec.role = 'host'
      AND ec.status = 'accepted'
      AND ec.community_id IN (
        SELECT cm.id FROM community_members cm
        WHERE cm.user_id = auth.uid()
      )
    )
  );

-- RLS Policies for sent_reminders (read-only, system-managed)
CREATE POLICY "Users can view sent_reminders for their events"
  ON sent_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_collaborations ec
      WHERE ec.event_id = sent_reminders.event_id
      AND ec.community_id IN (
        SELECT cm.id FROM community_members cm
        WHERE cm.user_id = auth.uid()
      )
    )
  );

-- Allow service role to insert into sent_reminders
CREATE POLICY "Service role can insert sent reminders"
  ON sent_reminders FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
