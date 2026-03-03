# Announcements Supabase Setup

This document explains what you need to configure in Supabase for the Announcements feature.

## 1) Run database migration

Migration file:
- `supabase/migrations/20260303_create_community_announcements.sql`

Run with your normal Supabase migration flow.

What it creates:
- `community_announcements`
- `community_announcement_images`
- indexes for list/image ordering
- updated_at trigger
- RLS policies:
  - public can read published announcements/images
  - community owner/admin can create/update/delete

## 2) Storage bucket for announcement images

The implementation uploads to existing bucket:
- `community-profile-pictures`

No new bucket is required.

Expected path pattern:
- `announcements/<timestamp>-<random>.<ext>`

If your bucket is private, either:
- switch it to public, or
- adjust code to use signed URLs for both community page and email templates.

Current implementation expects **public URLs**.

## 3) Required env vars

Ensure these are configured in app runtime:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (used for member email fan-out lookup/update)
- `RESEND_API_KEY`
- `EMAIL_SENDER`

## 4) Email provider setup (Resend)

Announcements use:
- `app/routes/api/announcements/new-announcement-notification.tsx`
- `app/shared/lib/email.server.ts`
- `app/templates/community-announcement-email.tsx`

Make sure your sender domain is verified in Resend and matches `EMAIL_SENDER`.

## 5) Post-migration validation checklist

Run these checks in Supabase SQL editor:

1. Insert test announcement as owner/admin user -> should succeed.
2. Insert as non-owner member -> should fail.
3. Read published announcements anonymously -> should succeed.
4. Read draft/unpublished announcements anonymously -> should fail.
5. Insert announcement image row linked to valid announcement -> should succeed for owner/admin.

## 6) App-level smoke test

1. Open dashboard: `/dashboard/<slug>/announcements`
2. Create announcement with title, description, and 1-5 images.
3. Confirm record appears on community page (`/c/<slug>`).
4. Confirm members receive email including title, description, and image URLs from Supabase storage.

## 7) Optional hardening

- Add a `sent_announcement_emails` table for idempotency and audit.
- Move image uploads to a dedicated bucket if you want stricter lifecycle/policy control.
- Add background job/queue for large member communities to avoid API timeouts.
