# Where is each screen? (Design guide)

You don’t need to understand all the code.  
Use this when chatting about a screen: **say the screen name**, and attach the folders below.

---

## Two folders that matter

1. **`app/routes/`** — the page itself (one file per screen)
2. **`app/modules/`** — the visual pieces used on that page (buttons, cards, forms, lists)

**Almost always edit the UI inside `app/modules/.../components/`.**  
Ignore anything under `app/routes/api/` — that’s not visual.

---

## Public website

| Screen | Page file | UI pieces |
| --- | --- | --- |
| Homepage / landing | `app/routes/web/index.tsx` | `app/modules/landing/components/` |
| Hub (your communities) | `app/routes/web/hub.tsx` | `app/modules/hub/components/` |
| Your profile | `app/routes/web/profile.tsx` | `app/modules/profile/components/` |
| Create community | `app/routes/web/create-community.tsx` | mostly in the page file |
| Community home | `app/routes/web/community-index.tsx` | `app/modules/community/components/` |
| Events list | `app/routes/web/events-index.tsx` | `app/modules/events/components/event-list/` |
| Event page | `app/routes/web/event-detail.tsx` | `app/modules/events/components/event-detail/` |
| Register for event | `app/routes/web/event-register.tsx` | `app/modules/events/components/event-register/` |
| Announcement | `app/routes/web/announcement-detail.tsx` | `app/modules/announcements/components/` |
| Write announcement | `app/routes/web/announcement-new.tsx` | `app/modules/announcements/components/` |
| Login / signup | `app/routes/auth/login.tsx` · `register.tsx` | `app/modules/auth/components/` |

---

## Admin dashboard

| Screen | Page file | UI pieces |
| --- | --- | --- |
| Dashboard sidebar / shell | `app/routes/dashboard/layout.tsx` | `app/modules/dashboard/components/` |
| Overview | `app/routes/dashboard/overview.tsx` | `app/modules/dashboard/components/` |
| Edit community profile | `app/routes/dashboard/edit-profile.tsx` | `app/modules/profile/components/` |
| Manage events | `app/routes/dashboard/events.tsx` | `app/modules/events/components/event-list/` |
| Create / edit event | `app/routes/dashboard/events-create.tsx` · `event-edit.tsx` | `app/modules/events/components/event-form/` |
| Event stats | `app/routes/dashboard/event-statistics.tsx` | `app/modules/events/components/event-statistics/` |
| Attenders | `app/routes/dashboard/attenders.tsx` | `app/modules/events/components/attenders/` |
| QR scanner | `app/routes/dashboard/event-scanner.tsx` | mostly in the page file |
| Announcements | `app/routes/dashboard/announcements.tsx` | `app/modules/announcements/components/` |
| Google Forms | `app/routes/dashboard/forms.tsx` | `app/modules/integrations/providers/google-forms/components/` |
| Settings | `app/routes/dashboard/settings.tsx` | `app/modules/dashboard/components/` |

---

## How to ask in chat

Example:

> I’m redesigning the **event page**.  
> Please use `@app/routes/web/event-detail.tsx` and `@app/modules/events/components/event-detail/`

That’s it — pick the row above that matches your screen.
