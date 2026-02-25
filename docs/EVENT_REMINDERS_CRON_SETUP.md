# Event Reminders Cron Job Setup Guide

This guide explains how to set up automated event reminder emails using cron-job.org.

## Overview

The event reminders system allows community organizers to send automated reminder emails to event participants at three different times:
- **1 hour before** the event starts
- **3 hours before** the event starts  
- **1 day before** the event starts

## How It Works

1. When creating/editing an event, organizers select which reminder times they want enabled
2. Optionally, they can provide a custom message to include in the reminder email
3. A cron job periodically calls the reminder API endpoint
4. The API identifies relevant participants and sends reminders
5. Sent reminders are tracked to prevent duplicates

## Prerequisites

Before setting up cron jobs, ensure:

1. **API Key**: Set the `CRON_SECRET` environment variable on your server
   ```
   CRON_SECRET=your-secret-key-here
   ```

2. **Email Service**: Ensure `RESEND_API_KEY` and `EMAIL_SENDER` are configured

3. **Database**: Run the migration to create the reminder tables:
   ```sql
   -- Ensure event_reminders and sent_reminders tables exist
   ```

## Setting Up Cron Jobs on cron-job.org

### Step 1: Create an Account

1. Go to [cron-job.org](https://cron-job.org/en/)
2. Sign up for a free account or log in
3. Verify your email address

### Step 2: Create a Cron Job for 1-Hour Reminders

1. Click **"Create a Cronjob"**
2. Fill in the following settings:

   **Basic Settings:**
   - **Title**: `Event Reminders - 1 Hour Before`
   - **URL**: `https://yourdomain.com/api/events/send-reminders`
   - **Request Method**: `POST`

   **Schedule:**
   - **Execution Time**: Select "Every hour" or "Hourly"
   - Alternative: Set to run at specific times (e.g., `:00` minute of every hour)

   **HTTP Headers:** Click "Add HTTP Header"
   - **Header Name**: `Content-Type`
   - **Header Value**: `application/json`

   **Request Body (JSON):**
   ```json
   {
     "reminderTime": "1-hour",
     "secret": "your-secret-key-here"
   }
   ```

3. **Notifications** (Optional):
   - Enable email notifications if the job fails
   - Set your email address

4. Click **"Create"**

### Step 3: Create a Cron Job for 3-Hour Reminders

1. Click **"Create a Cronjob"** again
2. Fill in similar settings as above:

   **Basic Settings:**
   - **Title**: `Event Reminders - 3 Hours Before`
   - **URL**: `https://yourdomain.com/api/events/send-reminders`

   **Schedule:**
   - **Execution Time**: Every 3 hours
   - Choose a start time that makes sense for your timezone
   - Example: Start at 00:00, 03:00, 06:00, 09:00, etc.

   **Request Body (JSON):**
   ```json
   {
     "reminderTime": "3-hours",
     "secret": "your-secret-key-here"
   }
   ```

3. Click **"Create"**

### Step 4: Create a Cron Job for 1-Day Reminders

1. Click **"Create a Cronjob"** one more time
2. Fill in the settings:

   **Basic Settings:**
   - **Title**: `Event Reminders - 1 Day Before`
   - **URL**: `https://yourdomain.com/api/events/send-reminders`

   **Schedule:**
   - **Execution Time**: Daily at a specific time
   - Choose a time that's convenient (e.g., 08:00 UTC)
   - Make sure this time is before most of your events start

   **Request Body (JSON):**
   ```json
   {
     "reminderTime": "1-day",
     "secret": "your-secret-key-here"
   }
   ```

3. Click **"Create"**

## Understanding the Settings

### URL
The endpoint that will receive the cron job request. Must be publicly accessible.

### Request Method
Always use `POST` for the reminder endpoint.

### Execution Time/Schedule
- **1-hour**: Should run frequently (every hour is recommended)
- **3-hours**: Should run every 3 hours (e.g., at 00:00, 03:00, 06:00, etc.)
- **1-day**: Should run once daily before most events start

### HTTP Headers
Content-Type must be `application/json` to properly send the request body.

### Request Body
Contains three fields:
- `reminderTime`: Which reminder type to process (`"1-hour"`, `"3-hours"`, or `"1-day"`)
- `secret`: The `CRON_SECRET` for security validation
- Ensures only authorized requests can trigger reminders

## Security Considerations

### Secret Key
1. Set a strong `CRON_SECRET` in your environment variables
2. Use a random string with uppercase, lowercase, numbers, and symbols
3. Example: `X9kL2mP@7qW#3nJr$8vBx`
4. Keep it secret - don't commit to version control

### Request Validation
The API validates:
- Request method is POST
- Secret matches the environment variable
- reminderTime is one of the three allowed values

### HTTPS Only
Always use `https://` URLs. Do not use `http://`.

## Testing

### Manual Test (Before Setting Up Cron)

1. Use a tool like Postman or curl to test the endpoint:

```bash
curl -X POST https://yourdomain.com/api/events/send-reminders \
  -H "Content-Type: application/json" \
  -d '{
    "reminderTime": "1-hour",
    "secret": "your-secret-key-here"
  }'
```

Expected response:
```json
{
  "success": true,
  "reminders_sent": 5,
  "message": "Reminders processed successfully"
}
```

### Checking Logs

1. Monitor your application logs for the endpoint calls
2. Look for messages like:
   - `🔄 Starting reminder send process for: 1-hour`
   - `✓ Email sent to participant@example.com`
   - `✓ Reminder process complete. Sent: X, Failed: 0`

### Database Verification

Check if reminders were recorded:

```sql
-- View all sent reminders
SELECT * FROM sent_reminders 
ORDER BY sent_at DESC 
LIMIT 10;

-- View event reminders configuration
SELECT * FROM event_reminders;
```

## Troubleshooting

### Cron Jobs Not Running

1. Check if the job is enabled:
   - Log into cron-job.org
   - View your created jobs
   - Ensure they show as "Active" or "Enabled"

2. Check execution logs:
   - Click on a job to view execution history
   - Look for any error messages
   - Check if the endpoint returned an error

3. Verify URL accessibility:
   - Use curl or Postman to manually test
   - Check if your domain is accessible from the internet
   - Verify SSL certificate is valid

### Emails Not Sending

1. Check environment variables:
   ```
   - RESEND_API_KEY is set
   - EMAIL_SENDER is configured
   - CRON_SECRET is set
   ```

2. Verify database connectivity:
   - Ensure Supabase connection is working
   - Check if event_reminders table has data
   - Verify sent_reminders table is accessible

3. Check email logs:
   - Look for messages in `shared/lib/email.server.ts` logs
   - Verify Resend API is working
   - Check if recipient emails are in the database

4. Test email sending:
   ```bash
   curl -X POST https://yourdomain.com/api/events/send-reminders \
     -H "Content-Type: application/json" \
     -d '{
       "reminderTime": "1-hour",
       "secret": "your-secret-key-here"
     }'
   ```

### Duplicate Reminders

The system prevents duplicates by:
- Tracking sent reminders in the `sent_reminders` table
- Checking if a reminder was already sent before sending again
- Using `unique_sent_reminder` constraint to prevent database duplicates

If duplicates still occur:
- Verify sent_reminders table has data
- Check if CRON_SECRET is being used correctly
- Review application logs for errors

### Timezone Issues

The system stores event times in ISO format with timezone information.
- Events are scheduled in the organizer's timezone
- Reminders are calculated based on UTC time
- Daylight Saving Time is handled by dayjs

To verify:
```sql
-- Check event times and timezones
SELECT title, start_time, timezone 
FROM events 
WHERE status = 'published' 
LIMIT 5;
```

## API Response Examples

### Successful Response
```json
{
  "success": true,
  "reminders_sent": 12,
  "message": "Reminders processed successfully"
}
```

### No Events to Remind
```json
{
  "success": true,
  "reminders_sent": 0,
  "message": "No events to remind"
}
```

### With Failures
```json
{
  "success": true,
  "reminders_sent": 10,
  "failures": [
    "invalid@email.com: Invalid email format",
    "test@example.com: Failed to send email"
  ]
}
```

### Authorization Error
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

## Monitoring

### Recommended Monitoring Setup

1. **Email Notification on Failure**:
   - Set up cron-job.org email alerts
   - Get notified when a job fails

2. **Application Logging**:
   - Monitor application logs for reminder processing
   - Track success/failure rates
   - Alert on repeated failures

3. **Database Monitoring**:
   - Monitor sent_reminders table growth
   - Track which events have most participants
   - Identify patterns in reminder delivery

### Example Dashboard Queries

```sql
-- Reminders sent by event in the last 24 hours
SELECT 
  e.title,
  COUNT(sr.id) as reminders_sent,
  COUNT(DISTINCT sr.reminder_time) as reminder_types,
  MAX(sr.sent_at) as last_sent
FROM sent_reminders sr
JOIN events e ON sr.event_id = e.id
WHERE sr.sent_at > NOW() - INTERVAL '24 hours'
GROUP BY e.id, e.title
ORDER BY reminders_sent DESC;

-- Failed reminders in the last 24 hours
SELECT * FROM sent_reminders 
WHERE sent_at > NOW() - INTERVAL '24 hours'
AND recipient_email LIKE '%failed%'
ORDER BY sent_at DESC;
```

## Advanced Configuration

### Custom Domain
If you want reminders to link to a custom domain:

1. Edit `/app/routes/api/events/send-reminders.tsx`
2. Change the line:
   ```typescript
   eventLink: `https://luhive.com/events/${event.id}`
   ```
   to your custom domain

### Multiple Instances
If you have multiple environments (staging, production):

1. Create separate Cron jobs for each
2. Use different CRON_SECRET for each
3. Point to the appropriate domain

## FAQ

**Q: Can I have different times for different events?**
A: No, the system uses fixed time blocks (1-hour, 3-hours, 1-day). Organizers choose which blocks to enable when creating an event.

**Q: What happens if an event gets deleted?**
A: The `ON DELETE CASCADE` constraint will remove related reminders and sent_reminders records.

**Q: Can participants opt-out of reminders?**
A: Currently, no. This could be added as a future feature with email preference management.

**Q: What if the cron job runs while my server is down?**
A: cron-job.org will log the failure. The job will retry on the next scheduled time. No reminders will be lost since they're tied to event start times.

**Q: How accurate is the timing?**
A: The system uses UTC timestamps and checks for events within time windows (with buffer). Minor delays (±5 minutes) may occur depending on cron job execution time.

## Support

For technical issues:
1. Check application logs
2. Verify database connectivity
3. Test the API endpoint manually
4. Review this guide's troubleshooting section
5. Check cron-job.org execution history

For configuration help:
1. Ensure CRON_SECRET is set correctly
2. Verify endpoint URL is accessible
3. Test with a manual request first
4. Check Resend API status
