-- Migration: Add notification fields and reminders table
-- Adds `notification_send_before` (text[]) and `notification_message` (text) to `events`
-- Creates `event_reminders` table and an enqueue function to populate reminders

-- 1) Add columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS notification_send_before text[] DEFAULT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS notification_message text DEFAULT NULL;

-- 2) Create reminders table
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  send_at TIMESTAMPTZ NOT NULL,
  send_offset TEXT NOT NULL,
  message TEXT,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_send_at ON public.event_reminders(send_at);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);

-- 3) Function to enqueue reminders for events that have notification timings
CREATE OR REPLACE FUNCTION public.enqueue_event_reminders()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  ev RECORD;
  timing TEXT;
  offset INTERVAL;
  send_ts TIMESTAMPTZ;
BEGIN
  FOR ev IN
    SELECT id AS event_id, start_time, notification_send_before, notification_message
    FROM public.events
    WHERE notification_send_before IS NOT NULL
  LOOP
    FOREACH timing IN ARRAY ev.notification_send_before LOOP
      IF timing = '1_hour' THEN
        offset := INTERVAL '1 hour';
      ELSIF timing = '3_hours' THEN
        offset := INTERVAL '3 hours';
      ELSIF timing = '1_day' THEN
        offset := INTERVAL '1 day';
      ELSE
        offset := INTERVAL '0';
      END IF;
      send_ts := ev.start_time - offset;

      -- insert reminder only if not already exists for same event and send_at
      INSERT INTO public.event_reminders(event_id, send_at, send_offset, message)
      SELECT ev.event_id, send_ts, timing, ev.notification_message
      WHERE NOT EXISTS (
        SELECT 1 FROM public.event_reminders er
        WHERE er.event_id = ev.event_id
          AND er.send_at = send_ts
          AND er.send_offset = timing
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Note: Scheduling of this function (e.g., via pg_cron or an external scheduler) is environment-specific.
-- Example pg_cron entry (if pg_cron is available):
-- SELECT cron.schedule('enqueue_event_reminders_every_5_minutes', '*/5 * * * *', $$SELECT public.enqueue_event_reminders();$$);
