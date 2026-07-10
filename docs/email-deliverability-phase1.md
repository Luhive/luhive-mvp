# Email Deliverability — Phase 1 Checklist (DNS & Infrastructure)

> **Context:** Transactional emails (OTP codes, registration confirmations) sent via Resend from
> `events@events.luhive.com` were landing in Gmail spam and Outlook junk. Investigation
> (2026-07-09) showed SPF/DKIM pass, but: the From-domain had no A/MX/TXT records ("ghost
> domain", penalized by Outlook), DMARC was org-level `p=none` with no reporting, emails are
> HTML-only, and bulk + transactional mail share one sender identity.
>
> **Scope:** Phase 1 is DNS/dashboard only — no code changes, nothing to deploy.
> Phase 2 (code + templates) is listed at the bottom.
>
> **DNS:** Cloudflare zone `luhive.com`. All records below are DNS-only (grey cloud).
>
> **Domain roles:**
> | Domain | Role |
> |---|---|
> | `luhive.com` | Google Workspace mailbox only — app never sends from it |
> | `events.luhive.com` | Transactional (OTP, confirmations, invites) — 7 months of history, keep |
> | `news.luhive.com` | Bulk/announcements (Resend Broadcasts) — created Jun 2026 |
> | `updates.luhive.com`, `test2.luhive.com` | Development/testing — keep, do not touch |

---

## Step 1 — Delete stale records (MailerLite + Fastmail exit)

- [ ] CNAME `litesrv._domainkey.luhive.com` → `litesrv._domainkey.mlsend.com` — **delete**
- [ ] CNAME `litesrv._domainkey.news.luhive.com` → `litesrv._domainkey.mlsend.com` — **delete**
- [ ] TXT `luhive.com` → `mailerlite-domain-verification=...` — **delete**
- [ ] TXT `news.luhive.com` → `mailerlite-domain-verification=...` — **delete**
- [ ] MX `news.luhive.com` → `10 mail.litesrv.io` — **delete** (replaced in Step 3)
- [ ] A `news.luhive.com` → `34.91.249.129` — **delete** (MailerLite leftover)

Keep everything for `updates.luhive.com` and `test2.luhive.com` (dev domains).

## Step 2 — Update existing records

- [ ] TXT `luhive.com` (SPF) — replace
      `v=spf1 include:spf.messagingengine.com a mx include:_spf.mlsend.com ~all`
      with:
      ```
      v=spf1 include:_spf.google.com ~all
      ```
      (Fastmail and MailerLite unused; `a mx` was ineffective; Google Workspace include was missing —
      Workspace mail was soft-failing SPF.)
- [ ] TXT `_dmarc.luhive.com` — **edit the existing record** (never have two DMARC TXTs), replace
      `v=DMARC1; p=none;` with:
      ```
      v=DMARC1; p=none; rua=mailto:<AGGREGATOR_ADDRESS>; adkim=r; aspf=r
      ```
- [ ] TXT `news.luhive.com` (SPF) — replace `v=spf1 a mx include:_spf.mlsend.com ~all` with:
      ```
      v=spf1 include:amazonses.com ~all
      ```

**`<AGGREGATOR_ADDRESS>`:** using Postmark DMARC Digests (dmarc.postmarkapp.com). Register
**three separate domains** there — `luhive.com`, `events.luhive.com`, `news.luhive.com` — each
gets its own `re+<token>@dmarc.postmarkapp.com` address; use each domain's own token in its
DMARC record (a token is tied to the domain it was created for). For `_dmarc.luhive.com`, paste
Postmark's suggested record as-is (`p=none; pct=100; rua=...; sp=none; aspf=r` — the extra tags
are defaults/harmless; `sp=none` is overridden by the subdomains' own records). For the
subdomain records keep our stricter `p=quarantine` policy even if Postmark's wizard suggests
`p=none` — their verification only checks that their rua address is present.

**Do not touch:** both `google-site-verification` TXTs, `google._domainkey`, the Google MX on
`luhive.com`, `subdomain-owner-verification`, all `send.*` TXT/MX records,
`resend._domainkey.*`, `redirect.events` / `go.news` CNAMEs.

## Step 3 — Add new records

| Name | Type | Content | Priority |
|---|---|---|---|
| `events` | TXT | `v=spf1 include:amazonses.com ~all` | — |
| `_dmarc.events` | TXT | `v=DMARC1; p=quarantine; rua=mailto:<AGGREGATOR_ADDRESS>` | — |
| `_dmarc.news` | TXT | `v=DMARC1; p=quarantine; rua=mailto:<AGGREGATOR_ADDRESS>` | — |
| `events` | MX | `smtp.google.com` | 1 |
| `news` | MX | `smtp.google.com` | 1 |

- [ ] All 7 records added

Why: the From-domain must have SPF and be able to receive mail — `events.luhive.com` previously
had *no* records at all, a strong Outlook junk signal. `p=quarantine` directly on the sending
subdomains is safe because only Resend sends from them and its SPF/DKIM are verified.

Note: Cloudflare Email Routing can't do this — it only routes addresses on the zone apex
(`@luhive.com`) on non-Enterprise plans. ImprovMX free covers only 1 domain. Instead we use
Google Workspace **domain aliases** (free, up to 20) — receiving MX points at Google itself,
which is also the strongest legitimacy signal.

## Step 4 — Google Workspace domain aliases (receiving)

- [ ] admin.google.com → Account → Domains → Manage domains → **Add a domain** →
      `events.luhive.com` → type **User alias domain** → verify via the TXT record Google
      provides (add it in Cloudflare)
- [ ] Same for `news.luhive.com`
- [ ] Add the MX records from Step 3 (`smtp.google.com`, priority 1) for both subdomains
- [ ] Domain aliases mirror existing addresses (`you@events.luhive.com` → `you@luhive.com`).
      Create `events@luhive.com` and `news@luhive.com` (free Groups: who-can-post = Anyone on
      the web, join = invited only, no external members). `events@luhive.com` also makes the
      ICS organizer address real
- [ ] The app's actual From address is `hi@events.luhive.com` (env `EMAIL_SENDER`, overrides the
      `events@` fallback in email.server.ts — keep it, recipients know this sender). Make it
      deliverable: Directory → Users → your user → add email alias `hi` → `hi@luhive.com`
      exists → mirror makes `hi@events.luhive.com` work
- [ ] Test: send a mail from an external account to `events@events.luhive.com`, confirm it
      arrives in the Workspace mailbox

## Step 5 — Resend dashboard

- [ ] `events.luhive.com` → Configuration → **Click tracking OFF** (link rewriting through
      `redirect.events.luhive.com` adds a redirect hop that spam filters penalize; not needed
      for transactional mail). Open tracking stays off.
- [ ] `news.luhive.com` → click tracking may stay ON (marketing mail, custom tracking domain
      `go.news.luhive.com` is already correctly configured)

## Step 6 — Verify DNS (~1h after saving)

```bash
dig +short TXT luhive.com                 # expect: v=spf1 include:_spf.google.com ~all
dig +short TXT _dmarc.luhive.com          # expect: p=none with rua=
dig +short TXT events.luhive.com          # expect: v=spf1 include:amazonses.com ~all
dig +short MX events.luhive.com           # expect: improvmx
dig +short TXT _dmarc.events.luhive.com   # expect: p=quarantine
dig +short TXT news.luhive.com            # expect: v=spf1 include:amazonses.com ~all
dig +short MX news.luhive.com             # expect: improvmx
dig +short TXT _dmarc.news.luhive.com     # expect: p=quarantine
```

## Step 7 — Monitoring setup

- [ ] Google Postmaster Tools (postmaster.google.com): add `luhive.com`, `events.luhive.com`,
      `news.luhive.com` (TXT verification in Cloudflare). Shows real Gmail spam rate + domain
      reputation once volume is sufficient.
- [ ] mail-tester.com: trigger a real production OTP/confirmation email to the address it gives;
      target 9+/10. Known deduction until Phase 2: missing plain-text part — ignore.
- [ ] Resend → Metrics: check bounce + complaint rates for recent months. Bounce >2% ⇒ add list
      hygiene to Phase 2.

## Follow-ups on a timer

- [ ] **+3–7 days:** DMARC reports arriving at aggregator; inbox placement test to a Gmail and an
      Outlook address
- [ ] **+2 weeks:** if reports are clean, tighten `_dmarc.events` and `_dmarc.news` to `p=reject`;
      consider moving `_dmarc.luhive.com` to `p=quarantine` once reports confirm only
      Workspace sends from root
- [ ] **Same day, right after Steps 1–5 are live** (big event is imminent — no need to wait):
      submit the Outlook.com Sender Support form (sendersupport.olc.protection.outlook.com) for
      `events.luhive.com` — transactional event emails junked, SPF/DKIM/DMARC configured, request
      mitigation. If the first reply is an automated "not eligible", reply and ask for escalation
      to human review; typically resolves in 1–3 business days. Note: submit only AFTER the DNS
      records are live — Microsoft checks the setup during review.
      (SNDS/JMRP are IP-based — Resend owns the IPs, skip those.)

---

## Phase 2 preview (code + templates, separate effort)

1. Add plain-text part to every send in `app/shared/lib/email.server.ts`
   (react-email `render(component, { plainText: true })`; hand-written text for raw-HTML templates)
2. Rewrite templates in `app/templates/` to be more human-like (owner request)
3. Move community announcements / new-event notification blasts from `events.luhive.com` to
   `news.luhive.com` (already warmed — sending admin feature announcements since Jun 2026)
4. Remove the "Sign up now" marketing box from the verification email (pure transactional scores better)
5. Reconsider attachments on first-touch confirmation email (ICS + 2 QR PNGs); ICS organizer
   address `events@luhive.com` should become a real, receivable address
6. List hygiene if Resend bounce rate >2%
