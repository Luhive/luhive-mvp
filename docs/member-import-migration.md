# Member Import / Community Migration — Design

> **Status:** Design agreed 2026-07-09. Build **after** the upcoming big event — the sending
> domains are mid-reputation-repair and `news.luhive.com` is barely warmed.
>
> **Decisions taken:**
> - Internal only. Communities send us their list; **the Luhive team runs every import.** No
>   admin-facing upload UI in v1.
> - Imported people are stored as **pending member rows (email only, no auth account)**.
> - Consent model: **hybrid engagement-gated** — imported people are subscribed, but the system
>   auto-pauses anyone who never engages, and hard-stops on bounces/complaints.

---

## 1. Why this needs care

The people on an incoming list opted in to *their community*, not to Luhive. To them, Luhive is
an unfamiliar sender. A meaningful fraction will press "spam" instead of "unsubscribe" — and
because all communities share sending infrastructure, **one careless import degrades delivery
for every community, including OTP codes.** The whole design below exists to keep a single bad
list from becoming a platform-wide incident.

Second-order risk: an old list contains dead addresses and recycled spam traps. Hard bounces and
trap hits damage domain reputation faster than complaints do.

## 2. What the current code forces us to change

| Finding | Location | Consequence |
|---|---|---|
| `community_members` has no email column; `user_id` FK → `profiles` is the only identity | [database.types.ts:206](../app/shared/models/database.types.ts) | Cannot represent an imported person who hasn't signed up. Schema change required. |
| Member emails resolved via `auth.admin.getUserById` in a **sequential loop** | [community-members.ts:45](../app/modules/community/utils/community-members.ts) | 200 members = 200 serial admin API calls. Too slow, will hit rate limits. Must be replaced. |
| Unsubscribe URL is signed over `communityId:userId` | [unsubscribe-token.server.ts](../app/shared/lib/email/unsubscribe-token.server.ts) | Pending members have no `userId`. Must re-key on `community_members.id`, while still verifying old-format links already sitting in people's inboxes. |
| `email_opt_out` + `List-Unsubscribe` one-click headers already exist | same | Good — Gmail's bulk-sender requirement is already satisfied for announcements. Reuse as-is. |

## 3. Schema

```sql
alter table community_members
  add column email            text,
  add column status           text not null default 'active',
    -- 'active' | 'pending' | 'dormant' | 'bounced' | 'complained'
  add column source           text not null default 'signup',
    -- 'signup' | 'import'
  add column import_batch_id  uuid references member_imports(id),
  add column invited_at       timestamptz,
  add column last_engaged_at  timestamptz,
  add column send_count       int  not null default 0,
  add column engagement_count int  not null default 0;

alter table community_members alter column user_id drop not null;

create unique index community_members_community_email_uniq
  on community_members (community_id, lower(email)) where email is not null;

create table member_imports (
  id                uuid primary key default gen_random_uuid(),
  community_id      uuid not null references communities(id),
  submitted_by      uuid references profiles(id),   -- the admin who gave us the list
  source_description text not null,                 -- "Luma export, collected 2024-01..2026-06"
  consent_attested_by text not null,                -- who confirmed consent, and how
  consent_attested_at timestamptz not null,
  row_count         int not null,
  accepted_count    int not null,
  rejected_count    int not null,
  status            text not null default 'draft',
    -- 'draft' | 'sending' | 'paused' | 'completed' | 'halted'
  created_at        timestamptz not null default now()
);
```

**Backfill `email` for existing members too.** Once every row carries an email, the
`getUserById` loop disappears entirely — one query replaces 200 round-trips. Keep it in sync
with a trigger on auth email change, or re-sync nightly.

## 4. Import pipeline (internal, manual)

Run as a script/internal route by the Luhive team. Six stages, each of which can reject the batch:

**a. Intake.** Community sends CSV (name, email minimum). We record in `member_imports`: who
sent it, where the data came from, how old it is, and their explicit consent statement. Keep the
email/message where they attested — this is the GDPR paper trail and the first thing you'll want
if complaints spike.

**b. Age check — the strongest single predictor of a bad import.** Ask when the list was
collected and when those people last heard from the community. Anything with no contact in
~18 months should be refused or split into a small pilot slice. A "clean" 3-year-old list is
still a dead list.

**c. Mechanical validation.** Reject rather than send: malformed syntax; domains with no MX
record (catches `gmial.com`-class typos); duplicates within the file; addresses already members
of that community; role addresses (`info@`, `admin@`, `noreply@`, `postmaster@`, `abuse@`) —
these are complaint magnets and frequent spam traps.

**d. Third-party verification.** For any list we didn't watch being collected, run it through
ZeroBounce/NeverBounce before the first send (~$2 per 1,000). This is the cheapest insurance in
the entire plan — it strips known-dead addresses and traps *before* they touch the domain.

**e. Insert as pending.** `status='pending'`, `source='import'`, `user_id=null`, linked to the
batch.

**f. Throttled acknowledgment send.** See §5.

**Precondition on timing:** don't import until the community actually has something to send
within ~2 weeks. Importing and then going silent for months means the eventual first email lands
on a list that has forgotten both the community and us.

## 5. The acknowledgment email

The first contact decides everything. Rules:

- **From: the community's name, not Luhive's** — `Cursor Baku <hi@news.luhive.com>`. They
  recognize the community; that recognition is the entire defense against a spam click. Luhive
  is explained inside the body.
- **Send from `news.luhive.com`, never `events.luhive.com`.** Bulk and transactional identities
  must stay separate so an import can't touch OTP delivery. (This is the same split already
  queued in the Phase 2 deliverability work.)
- **Subject:** state the fact — `Cursor Baku is now on Luhive`.
- **"Why am I getting this" goes near the top, not buried in the footer:** *"You're receiving
  this because you're on Cursor Baku's member list."*
- **Body:** the community moved its events to Luhive; their spot is saved; create a free account
  to get invites and manage registrations. One CTA. The community's logo is the only image.
- **Do not say "we created an account for you"** — we haven't, and it sounds like a breach.
  Frame it as *claim your spot*.
- Visible unsubscribe link **and** `List-Unsubscribe` one-click headers (already implemented).
- Plain-text part — automatic now, via the Phase 2 change to `email.server.ts`.

**Throttle:** ~50/day per community, spread across hours. Never a 200-recipient burst. New-domain
volume spikes are themselves a spam signal, independent of content.

## 6. Engagement gating (the "hybrid" model)

Imported members receive announcements normally, but the system prunes the list on its own:

- Every send increments `send_count`. Every **click** sets `last_engaged_at` and increments
  `engagement_count`.
- **Weight clicks, distrust opens.** Apple Mail Privacy Protection auto-loads images, so opens
  are inflated and unreliable; a click is a real human. (Click tracking is already configured on
  `news.luhive.com` via `go.news.luhive.com` — and correctly *disabled* on the transactional
  domain.)
- After **5 sends with zero engagement** → `status='dormant'`, `email_opt_out=true`. They stop
  receiving mail. Reversible if they later sign up or click a link elsewhere.
- **Hard bounce → immediate** `status='bounced'`, opt-out. No retry, ever.
- **Complaint → immediate** `status='complained'`, opt-out, and flag the batch for review.

Wire this to Resend webhooks (`email.bounced`, `email.complained`, `email.clicked`,
`email.delivered`) — the Webhooks section of the Resend dashboard. Without the webhook consumer,
none of the safety rails in §7 can fire, so build it *before* the first real import.

## 6a. Reach: pending members are full recipients

An account is never required to stay in the loop. Pending rows receive **new-event
notifications and announcements exactly like signed-up members** — gating outreach behind
signup would defeat the purpose of the migration.

Two code changes make this true; without them pending rows are silently skipped by every send:

- `getCommunityMemberEmails` / `getCommunityMemberEmailsWithIds` must read the new `email`
  column instead of resolving `user_id` through the auth API. A row with `user_id = null`
  currently vanishes from the recipient list.
- `sendNewEventNotificationEmail` / `sendAnnouncementNotificationEmail` build unsubscribe URLs
  from `recipientUserId` — re-key on `community_members.id` (see §2).

The loop closes through **guest registration, which already works today**: pending member gets
the announcement → clicks → registers for the event without an account → gets the transactional
confirmation. That click counts as engagement, so an active non-account member never goes
dormant. Signing up only makes registration one-click.

Note the domain split still applies per message type, not per member: bulk announcements to
pending members go out on `news.luhive.com`; the registration confirmation that follows is
transactional and goes on `events.luhive.com`.

## 7. Circuit breakers

Evaluated continuously during a batch; on trip, pause the batch and alert the team:

| Metric | Threshold | Action |
|---|---|---|
| Hard bounce rate | > 3% | Halt batch, re-verify remaining addresses |
| Complaint rate | > 0.1% | Halt batch, review list provenance |
| Any single batch | — | Never auto-resume; a human decides |

Gmail treats 0.3% complaints as bad; 0.1% is the target to stay comfortably clear.

## 8. Claim / link flow

When someone signs up with an email matching a pending row: link `user_id`, set
`status='active'`, keep `source='import'` for attribution. They land in the community already
joined — this is the payoff that makes the whole migration feel seamless to the end user.

Handle the race where two communities imported the same person: match on
`(community_id, lower(email))`, so one signup can activate several pending rows at once.

## 9. Build order

1. Resend webhook consumer + bounce/complaint handling *(prerequisite for everything else)*
2. Schema migration + email backfill for existing members
3. Replace the `getUserById` loop with a single query
4. Re-key unsubscribe on `community_members.id`, keeping old links valid
5. Import script (validation → `member_imports` → pending rows)
6. Acknowledgment template + throttled sender on `news.luhive.com`
7. Engagement counters + dormancy sweep
8. Claim-on-signup linking
9. Internal dashboard: batch status, bounce/complaint rates per import

## 10. Open items

- Which verification vendor (ZeroBounce vs NeverBounce) — pick when the first real list arrives.
- Where the CSV intake lives (shared drive vs. an internal upload) — manual for now, formalize
  if volume grows.
- Whether dormant members should get one "still interested?" re-engagement email before being
  paused, or be paused silently. Silent is safer; revisit with real data.
