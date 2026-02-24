# Notification Settings - Supabase / DB Guidance

This project now supports per-event reminder timings and a custom notification message. The frontend sends the following fields when creating/updating an event:

- `notification_send_before` - array of strings indicating when to send reminders. Possible values: `"1_hour"`, `"3_hours"`, `"1_day"`.
- `notification_message` - nullable text. If null, server-side logic should generate a default message.

Database recommendation

Option A (recommended): Add a text array column for timings and a text column for message:

```sql
-- Add columns to `events` table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS notification_send_before text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_message text DEFAULT NULL;
```

Option B: Store settings as JSONB if you prefer a single column:

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT NULL;
-- Example value: { "send_before": ["1_hour","1_day"], "message": "..." }
```

Migration steps (Supabase CLI)

1. Install Supabase CLI if not already installed.
2. Create a new migration file (timestamped) and add the SQL above, eg:

```bash
supabase migration new add_event_notification_settings
# Edit migrations/<timestamp>_add_event_notification_settings.sql and paste SQL
supabase db push
```

Server-side considerations

- Scheduling: You need a job scheduler (CRON, worker queue, or Supabase scheduled functions) to check upcoming events and send reminders at the requested offsets. The scheduler should:
  - Query `events` for upcoming events where `notification_send_before` is not null.
  - For each timing in the array, compute send time = event.start_time - offset.
  - Enqueue/send email/SMS/notification at the computed times.

- Default message: If `notification_message` is null, server logic should build a default message using event title and start time.

- Permissions/RLS: If you use RLS, ensure the migration and any server functions operate with appropriate roles (service role or authorized function) when inserting/updating these fields.

Notes

- The frontend will send an array for `notification_send_before`. Ensure the DB column type matches (text[] or jsonb).
- If you prefer different value keys (e.g., store offsets in minutes), adapt both frontend and server accordingly.

If you want, I can create the actual SQL migration file in `supabase/migrations/` with a timestamped filename and/or implement a simple server-side scheduled function example.