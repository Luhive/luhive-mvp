# How to write daily logs

Use this guide when adding entries to `docs/logs/`. The goal is a **short, readable record of what shipped** — for you, teammates, and future-you — without turning it into a code diff.

Reference example: [`06-07-2026.md`](./06-07-2026.md)

---

## File naming

- One file per day: `DD-MM-YYYY.md` (e.g. `06-07-2026.md`)
- Start with a single `#` title matching the date

---

## Tone

**Feature-based, not too technical.**

Write about **what users can now do** and **what changed in the product**, not which files or functions were touched.

| Prefer | Avoid |
|--------|--------|
| "Communities can add a Discord link" | "`edit-profile-action.server.ts` now reads `discord` from formData" |
| "Click your name in the sidebar to open your profile" | "Replaced `DropdownMenuLabel` with `DropdownMenuItem asChild`" |
| "Discord icon matches other social icons (grayscale)" | "Added `grayscale` class to `/discord-logo.svg`" |

File paths, migration names, and handler details belong in PRs, commits, or deeper docs — not in the daily log unless they are essential to understand the feature.

---

## Structure

### 1. One `##` section per feature

Each shipped piece of work gets its own heading:

```markdown
## Short feature name — optional subtitle
```

Good headings name the **area** and **outcome**:

- `## Sidebar — quick access to your profile`
- `## Community profile — Discord link`

### 2. One short intro sentence

Explain the feature in plain language — what it is and why it matters in one or two sentences.

### 3. Bullets for behaviour

Use bullets to describe **what happens** when someone uses the product:

- Where in the UI it lives (dashboard, public page, sidebar, etc.)
- What the user clicks or sees
- What stays the same, if relevant ("Log out option is unchanged")

Keep bullets scannable. **Bold** the surface/place when it helps (e.g. **Edit profile (dashboard):**, **Public community page:**).

---

## Length

- **Small change:** intro + 2–4 bullets
- **Medium feature:** intro + a handful of bullets; split into sub-bullets only if it stays easy to skim
- **Large feature:** still one `##` per feature; do not paste implementation checklists

If a day has multiple unrelated features, add multiple `##` sections in the same file — do not create extra files for the same date.

---

## What to include

- User-visible behaviour and flows
- New fields, buttons, links, or pages
- Visual or UX tweaks that matter (e.g. icon styling, copy changes)
- What was intentionally left unchanged

## What to skip (unless critical)

- Full file lists
- Schema/SQL unless the log is specifically about a data migration
- API contracts, cron schedules, env vars
- Step-by-step refactors with no user-facing effect

---

## Template

```markdown
# DD-MM-YYYY

## Area — what shipped

One or two sentences describing the feature in plain language.

- What the user can do now
- Where it appears in the app
- Any notable detail (styling, limits, edge case)
- What did not change (optional)
```

---

## When to go slightly more technical

Older logs in this folder sometimes include tables, routes, and file names. That is fine for **complex infrastructure** (cron jobs, migrations, multi-step pipelines) when the behaviour cannot be explained without it.

Default to the **06-07-2026** style. Only add technical depth when the feature truly needs it — and keep it in a short subsection, not the whole entry.
