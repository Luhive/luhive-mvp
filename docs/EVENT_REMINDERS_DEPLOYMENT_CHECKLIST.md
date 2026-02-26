# Event Reminders - Complete Setup Checklist

Follow this checklist to deploy the event reminders feature.

## Phase 1: Database Setup

- [ ] **Apply Migration**
  ```bash
  supabase push
  ```
  This creates:
  - `event_reminders` table
  - `sent_reminders` table
  - RLS policies
  - Indexes for performance

- [ ] **Verify Tables Exist**
  ```sql
  SELECT * FROM event_reminders LIMIT 1;
  SELECT * FROM sent_reminders LIMIT 1;
  ```

## Phase 2: Environment Configuration

- [ ] **Set CRON_SECRET**
  ```bash
  # Add to .env.local or your server environment
  CRON_SECRET=your-secure-random-string
  ```
  Example (generate a secure one):
  ```bash
  # Linux/Mac
  openssl rand -base64 32
  
  # Or use any random password generator
  ```

- [ ] **Verify Existing Configs**
  ```bash
  # Check these are already set
  echo $RESEND_API_KEY      # Should be set
  echo $EMAIL_SENDER        # Should be set
  ```

## Phase 3: Deploy Code Changes

- [ ] **Deploy to Production**
  ```bash
  # Build and deploy your application
  npm run build
  # Deploy to your hosting (Netlify, Vercel, etc.)
  ```

- [ ] **Verify Files Deployed**
  - [ ] `app/modules/events/components/event-form/fields/event-reminders.tsx`
  - [ ] `app/modules/events/server/api-send-reminders.server.tsx`
  - [ ] `app/routes/api/events/send-reminders.tsx`
  - [ ] `app/templates/event-reminder-email.tsx`

## Phase 4: Test API Endpoint

- [ ] **Test in Development**
  ```bash
  curl -X POST http://localhost:5173/api/events/send-reminders \
    -H "Content-Type: application/json" \
    -d '{
      "reminderTime": "1-hour",
      "secret": "development-secret"
    }'
  ```

- [ ] **Check Response**
  Should return:
  ```json
  {
    "success": true,
    "reminders_sent": 0,
    "message": "No events to remind"
  }
  ```

- [ ] **Test in Production**
  ```bash
  curl -X POST https://yourdomain.com/api/events/send-reminders \
    -H "Content-Type: application/json" \
    -d '{
      "reminderTime": "1-hour",
      "secret": "your-actual-secret"
    }'
  ```

## Phase 5: UI Testing

- [ ] **Test Event Creation**
  1. Go to create a new event
  2. Scroll to "Event Reminders" section
  3. Select reminder times
  4. (Optional) Add custom message
  5. Save event
  6. Verify in database:
     ```sql
     SELECT * FROM event_reminders WHERE event_id = 'xxx';
     ```

- [ ] **Test Event Editing**
  1. Edit an existing event
  2. Change reminder settings
  3. Save
  4. Verify changes in database

## Phase 6: Cron Job Setup (cron-job.org)

Follow the detailed guide at: `docs/EVENT_REMINDERS_CRON_SETUP.md`

### Quick Setup:

- [ ] **Create cron-job.org account**
  - Go to https://cron-job.org/en/
  - Sign up and verify email

- [ ] **Job 1: 1-Hour Reminders**
  - [ ] Title: `Event Reminders - 1 Hour Before`
  - [ ] URL: `https://yourdomain.com/api/events/send-reminders`
  - [ ] Method: POST
  - [ ] Schedule: Every hour
  - [ ] Header: `Content-Type: application/json`
  - [ ] Body:
    ```json
    {
      "reminderTime": "1-hour",
      "secret": "your-actual-secret"
    }
    ```

- [ ] **Job 2: 3-Hour Reminders**
  - [ ] Title: `Event Reminders - 3 Hours Before`
  - [ ] URL: `https://yourdomain.com/api/events/send-reminders`
  - [ ] Method: POST
  - [ ] Schedule: Every 3 hours
  - [ ] Header: `Content-Type: application/json`
  - [ ] Body:
    ```json
    {
      "reminderTime": "3-hours",
      "secret": "your-actual-secret"
    }
    ```

- [ ] **Job 3: 1-Day Reminders**
  - [ ] Title: `Event Reminders - 1 Day Before`
  - [ ] URL: `https://yourdomain.com/api/events/send-reminders`
  - [ ] Method: POST
  - [ ] Schedule: Daily at 08:00 UTC
  - [ ] Header: `Content-Type: application/json`
  - [ ] Body:
    ```json
    {
      "reminderTime": "1-day",
      "secret": "your-actual-secret"
    }
    ```

## Phase 7: End-To-End Testing

- [ ] **Create Test Event**
  1. Create an event starting in ~1 hour
  2. Enable 1-hour reminder
  3. Register test participants
  4. Wait for hourly cron job to run

- [ ] **Check Email Was Sent**
  ```sql
  SELECT * FROM sent_reminders 
  ORDER BY sent_at DESC 
  LIMIT 10;
  ```

- [ ] **Verify Email Content**
  - Check participant's inbox
  - Verify email contains:
    - Event title
    - Event date/time
    - Location or meeting link
    - Event details link

- [ ] **Test Multiple Reminders**
  1. Create event starting in ~1.5 days
  2. Enable all three reminder options
  3. Verify reminders are sent at each time

## Phase 8: Monitoring & Validation

- [ ] **Set Up Error Alerts**
  - Enable cron-job.org email alerts
  - Monitor application logs

- [ ] **Check Success Rate**
  ```sql
  -- Count reminders sent today
  SELECT reminder_time, COUNT(*) 
  FROM sent_reminders 
  WHERE sent_at > NOW() - INTERVAL '24 hours'
  GROUP BY reminder_time;
  ```

- [ ] **Monitor Failures**
  ```sql
  -- Check for any null recipient emails
  SELECT * FROM sent_reminders 
  WHERE recipient_email IS NULL OR recipient_email = '';
  ```

## Phase 9: Documentation

- [ ] **Read Full Guides**
  - [ ] `docs/EVENT_REMINDERS_SUMMARY.md` - Overview
  - [ ] `docs/EVENT_REMINDERS_CRON_SETUP.md` - Detailed setup

- [ ] **Share with Team**
  - [ ] Send documentation links
  - [ ] Provide CRON_SECRET securely
  - [ ] Document any custom domain changes

## Phase 10: Troubleshooting

If issues occur, check:

- [ ] **Cron jobs not running?**
  - Verify URL is publicly accessible
  - Check SSL certificate is valid
  - Check cron-job.org execution history
  - Verify CRON_SECRET matches

- [ ] **Emails not sending?**
  - Check RESEND_API_KEY is set
  - Check EMAIL_SENDER is configured
  - Verify event reminders are enabled
  - Check event_registrations has approved participants
  - Review application logs

- [ ] **Database issues?**
  - Verify RLS policies are correct
  - Check event_reminders table has data
  - Verify sent_reminders is accessible

See `docs/EVENT_REMINDERS_CRON_SETUP.md` for detailed troubleshooting.

## Rollback (If Needed)

If you need to disable reminders:

```sql
-- Option 1: Delete all event reminders
DELETE FROM event_reminders;

-- Option 2: Disable specific event
DELETE FROM event_reminders WHERE event_id = 'xxx';

-- Option 3: Delete cron jobs (on cron-job.org)
-- Go to https://cron-job.org and delete the jobs
```

## Performance Metrics to Monitor

Track these over time:

```sql
-- Events with reminders
SELECT COUNT(*) FROM event_reminders;

-- Total reminders sent (all time)
SELECT COUNT(*) FROM sent_reminders;

-- Reminders sent today
SELECT COUNT(*) FROM sent_reminders 
WHERE sent_at > NOW() - INTERVAL '24 hours';

-- Average participants per event
SELECT AVG(count) FROM (
  SELECT COUNT(*) as count 
  FROM event_registrations 
  WHERE status = 'approved' 
  GROUP BY event_id
) subq;
```

## Success Criteria

✅ Feature is successfully deployed when:

1. Event reminders UI appears in event creation form
2. Reminders can be selected and saved with events
3. Cron jobs are running on schedule
4. Emails are being sent to participants
5. No duplicate emails are sent
6. Error alerts are being triggered for failures
7. Team members have access to documentation

## Support Contacts

If issues persist:
- [ ] Check application logs
- [ ] Review database queries
- [ ] Test API endpoint manually
- [ ] Check cron-job.org website status
- [ ] Review Resend email service status

---

## Quick Reference

**Key Files:**
- Migration: `supabase/migrations/20260225_create_event_reminders.sql`
- UI Component: `app/modules/events/components/event-form/fields/event-reminders.tsx`
- API Endpoint: `app/routes/api/events/send-reminders.tsx`
- Email Template: `app/templates/event-reminder-email.tsx`
- Setup Guide: `docs/EVENT_REMINDERS_CRON_SETUP.md`

**Key Environment Variables:**
```bash
CRON_SECRET=your-secure-secret
RESEND_API_KEY=existing
EMAIL_SENDER=existing
```

**API Endpoint:**
```
POST /api/events/send-reminders
Content-Type: application/json
Body: {
  "reminderTime": "1-hour"|"3-hours"|"1-day",
  "secret": "CRON_SECRET"
}
```

---

**Last Updated:** 2026-02-25
**Feature Status:** ✅ Ready for Deployment
