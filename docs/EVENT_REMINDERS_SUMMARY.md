# Event Reminders Feature - Implementation Summary

## What Was Built

A complete event reminder system that allows organizers to send automated reminder emails to participants at 3 different times before an event starts.

## Components Created

### 1. **Database Migration** 
📄 `supabase/migrations/20260225_create_event_reminders.sql`

**Tables Created:**
- `event_reminders` - Stores reminder configuration per event
  - `reminder_times` - Array of enabled reminder times (1-hour, 3-hours, 1-day)
  - `custom_message` - Optional custom email message
  
- `sent_reminders` - Tracking table to prevent duplicate sends
  - Records when a reminder was sent to a participant
  - Unique constraint prevents duplicates

**Features:**
- Row-level security (RLS) policies
- Only host communities can manage reminders
- Automatic cascade deletion when events are deleted
- Indexed for efficient queries

---

### 2. **UI Component**
📄 `app/modules/events/components/event-form/fields/event-reminders.tsx`

**Features:**
- Multi-select checkboxes for reminder times:
  - ☑️ 1 Hour Before
  - ☑️ 3 Hours Before  
  - ☑️ 1 Day Before
  
- **Custom Message Option:**
  - Toggle between default and custom message
  - Uses variable substitution:
    - `{participantName}`
    - `{eventTitle}`
    - `{eventDateTime}`
    - `{eventLocation}`
    - `{communityName}`

- **Visual Feedback:**
  - Shows how many reminders will be sent
  - Helpful tips and examples
  - Reset to default message button

---

### 3. **Email Template**
📄 `app/templates/event-reminder-email.tsx`

**Features:**
- Professional React Email component
- Displays event details with proper formatting
- Shows location and meeting link
- Supports custom message display
- Mobile-responsive design
- Branded with Luhive logo

---

### 4. **API Endpoint**
📄 `app/routes/api/events/send-reminders.tsx`

**Functionality:**
- Called by cron jobs to send reminders
- Processes events that need reminders at specific times
- Tracks sent reminders to prevent duplicates
- Returns detailed logging information
- Security: Requires `CRON_SECRET` environment variable

**Response Examples:**
```json
{
  "success": true,
  "reminders_sent": 12
}
```

---

### 5. **Setup Guide**
📄 `docs/EVENT_REMINDERS_CRON_SETUP.md`

**Comprehensive guide covering:**
- ✅ Step-by-step cron-job.org setup
- ✅ Security configuration
- ✅ Testing instructions
- ✅ Troubleshooting
- ✅ Monitoring setup
- ✅ FAQ and examples

---

## Integration Points

### Updated Files:

1. **`app/modules/events/components/event-form/event-form.tsx`**
   - Added reminder state management
   - Integrated EventReminders component
   - Handles reminder creation/update on event save

---

## How to Use (For Organizers)

### Creating an Event with Reminders:

1. Go to event creation form
2. Scroll to **"Event Reminders"** section
3. Select desired reminder times:
   - ✓ Select multiple options
   - Example: Choose "1 Hour Before" + "1 Day Before"
4. (Optional) Use custom message:
   - Check "Use custom message"
   - Enter your message with variables
5. Save/Publish event
6. Reminders will be sent automatically!

### Example Flow:
```
Event: "Tech Conference"
Date: 2026-02-25 14:00 UTC

Selected reminders: 
  ✓ 1 Day Before    → Sent 2026-02-24 14:00
  ✓ 1 Hour Before   → Sent 2026-02-25 13:00
  
Custom message:
"Hi {participantName}, {eventTitle} starts {eventDateTime} at {eventLocation}"
```

---

## How to Use (For Administrators)

### Setup Required:

1. **Set Environment Variables:**
   ```bash
   CRON_SECRET=your-secure-random-string-here
   RESEND_API_KEY=re_xxxxx
   EMAIL_SENDER=your-email@domain.com
   ```

2. **Run Database Migration:**
   ```bash
   supabase migration up
   ```

3. **Set Up Cron Jobs:**
   - Go to [cron-job.org](https://cron-job.org/en/)
   - Follow the detailed guide in `EVENT_REMINDERS_CRON_SETUP.md`
   - Create 3 cron jobs:
     - 1-hour reminders (every hour)
     - 3-hours reminders (every 3 hours)
     - 1-day reminders (daily)

### Example POST Request to Endpoint:
```bash
curl -X POST https://yourdomain.com/api/events/send-reminders \
  -H "Content-Type: application/json" \
  -d '{
    "reminderTime": "1-hour",
    "secret": "your-secure-string"
  }'
```

---

## Feature Highlights

### For Event Organizers:
- 🎯 Simple, intuitive UI
- 🔄 Multi-select reminders
- ✍️ Custom message support
- 📧 Professional email design
- 📱 Mobile-friendly emails
- 🔐 Secure and reliable

### For Participants:
- 📧 Timely reminders
- 📅 Event details included
- 🔗 Direct event link
- 💬 Personalized messages
- 🎨 Beautiful email design

### For Administrators:
- 🔒 Secure cron job validation
- 📊 Detailed logging
- 🛡️ Duplicate prevention
- 🗄️ Database tracking
- 🔄 Error handling
- 📋 Comprehensive documentation

---

## Email Variables Reference

Use these in custom messages:

| Variable | Replaced With |
|----------|---------------|
| `{participantName}` | Attendee's full name |
| `{eventTitle}` | Event title/name |
| `{eventDateTime}` | Date & time (formatted) |
| `{eventLocation}` | Address or "Online" |
| `{communityName}` | Organizing community name |

**Example Custom Message:**
```
Hi {participantName}!

Reminder: {eventTitle} is starting {eventDateTime}!

📍 {eventLocation}

See you there!
```

---

## Database Schema

### event_reminders Table
```sql
id UUID          -- Primary key
event_id UUID    -- Foreign key to events
reminder_times   -- Array: '1-hour'|'3-hours'|'1-day'
custom_message   -- TEXT: Optional custom message
created_at       -- Timestamp
updated_at       -- Timestamp
```

### sent_reminders Table
```sql
id UUID            -- Primary key
event_id UUID      -- Foreign key to events
registration_id    -- Foreign key to event_registrations
reminder_time      -- The reminder type sent
sent_at TIMESTAMP  -- When it was sent
recipient_email    -- Who received it
```

---

## Testing the System

### Quick Test:
1. Create a test event
2. Set reminders to all three options
3. Manually trigger the API endpoint:
   ```bash
   curl -X POST http://localhost:5173/api/events/send-reminders \
     -H "Content-Type: application/json" \
     -d '{"reminderTime": "1-hour", "secret": "development-secret"}'
   ```
4. Check email logs and database

### Monitor in Production:
```sql
-- View recent reminders sent
SELECT * FROM sent_reminders 
ORDER BY sent_at DESC 
LIMIT 20;

-- Check event reminder configuration
SELECT e.title, er.reminder_times, er.custom_message
FROM event_reminders er
JOIN events e ON er.event_id = e.id;
```

---

## Security Notes

- ✅ Requires `CRON_SECRET` validation
- ✅ RLS policies protect data
- ✅ Only published events send reminders
- ✅ Only approved participants get emails
- ✅ HTTPS required for cron jobs
- ✅ Duplicate sends are prevented
- ✅ Service role only for tracking

---

## Next Steps

1. **Deploy Database Migration**
   ```bash
   supabase push
   ```

2. **Test UI Component**
   - Create/edit an event
   - Verify reminder section appears
   - Test saving with reminders

3. **Set Up Cron Jobs**
   - Follow `EVENT_REMINDERS_CRON_SETUP.md`
   - Start with development environment
   - Verify logs show successful execution

4. **Monitor & Optimize**
   - Watch email logs
   - Track sent/failed counts
   - Adjust timing if needed

---

## Files Modified/Created

✅ **New Files:**
- `supabase/migrations/20260225_create_event_reminders.sql`
- `app/modules/events/components/event-form/fields/event-reminders.tsx`
- `app/templates/event-reminder-email.tsx`
- `app/routes/api/events/send-reminders.tsx`
- `docs/EVENT_REMINDERS_CRON_SETUP.md`

✅ **Modified Files:**
- `app/modules/events/components/event-form/event-form.tsx`

---

## Support & Troubleshooting

For issues, see the troubleshooting section in:
📄 `docs/EVENT_REMINDERS_CRON_SETUP.md`

Key topics:
- Cron jobs not running
- Emails not sending
- Duplicate reminders
- Timezone issues
