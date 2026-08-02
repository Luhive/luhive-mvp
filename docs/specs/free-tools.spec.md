# Part B Implementation Spec — ICS Generator on luhive.com

Work on the **main luhive.com repo** (React Router v7, Netlify).

The free ICS generator is a separate Next.js site deployed to `luhive-tools.netlify.app`.
It must appear at `luhive.com/tools/ics-generator` on the main domain, and a first-touch
cookie it writes must reach Cal.com when someone later books a demo.

Four code changes. Dashboard steps are listed at the end and are NOT part of this task.

---

## 1. Netlify rewrite

In `netlify.toml`:

```toml
[[redirects]]
  from = "/tools/*"
  to = "https://luhive-tools.netlify.app/:splat"
  status = 200
  force = true
```

`status = 200` makes this a rewrite, not a redirect, so the browser and Google both keep
seeing `luhive.com/tools/ics-generator`. That is the entire point: the tool inherits the
main domain's authority.

**Placement is critical.** Netlify evaluates rules top to bottom and stops at the first
match. This rule must sit **above** the React Router SPA catch-all (`/* → /index.html 200`).
If the catch-all is higher, every `/tools/*` request is swallowed by the app router and
renders the app's 404 page.

If the project uses a `_redirects` file instead, add the equivalent there, again above the
catch-all:

```
/tools/*  https://luhive-tools.netlify.app/:splat  200!
```

Do not use both files for this. Pick whichever the project already uses.

Also add, so `/tools/` is not a dead end while there is only one tool:

```toml
[[redirects]]
  from = "/tools"
  to = "/tools/ics-generator"
  status = 302
```

302 not 301: this becomes a real index page once a second tool exists, and a cached
permanent redirect would be awkward to undo.

**Verify after deploy:**

```
curl -sI https://luhive.com/tools/ics-generator | head -20
```

Expect `200`, and the body should be the tool page, not the app shell. Getting the React
app's HTML back means the rule is in the wrong position.

---

## 2. Umami on the main site

Add the tracker to the root document using the **same website ID as the tool**. One website
ID across both sites is what allows a funnel to follow someone from the tool through to a
booking. Two IDs would make that impossible.

In `root.tsx`, inside the `<head>` of the root layout:

```html
<script
  defer
  src="https://cloud.umami.is/script.js"
  data-website-id="f5c72579-b361-4002-bda5-bd5ffb7e247d"
  data-tag="main"
  data-domains="luhive.com"
  data-performance="true"
></script>
```

Only `data-tag` differs from the tool's script (`ics-generator` there, `main` here). That is
what separates the two in reporting.

**Do not add `data-exclude-search`.** It strips query parameters, which would break UTM
tracking for the directory launch.

Expect no data on localhost or Netlify previews. `data-domains` does that deliberately.

---

## 3. First-touch cookie into Cal.com

This is what makes the experiment measurable. Read the contract before writing code.

### The cookie contract

The tool site writes a cookie named exactly `lh_first_touch` on a visitor's first arrival.
First-party on `luhive.com`, `path=/`, so it is sent with requests to the main site.

Value is URL-encoded JSON:

```json
{
  "source": "tools-ics-generator",
  "referrer": "https://www.google.com/",
  "utm_source": null,
  "ts": "2026-08-01T10:00:00.000Z"
}
```

Only `source` is needed here. Treat every field as untrusted: it is client-set, so parse
defensively and never interpolate it anywhere unescaped.

### Read it server-side

Client-side reading works but flashes the un-parameterised link and complicates hydration.
React Router v7 has the request, so read it in a loader.

```ts
// app/utils/first-touch.server.ts
const ALLOWED_SOURCES = new Set(['tools-ics-generator'])

export function readFirstTouchSource(request: Request): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null

  const match = header.match(/(?:^|;\s*)lh_first_touch=([^;]*)/)
  if (!match) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]))
    const source = parsed?.source
    return typeof source === 'string' && ALLOWED_SOURCES.has(source) ? source : null
  } catch {
    return null
  }
}
```

The allow-list matters. Without it, anyone can set that cookie to arbitrary text and it
lands in your booking records. Add future tool slugs to the set as they ship.

### Expose it where the demo button lives

If Book a demo is in a shared header or footer, put the loader in `root.tsx`:

```ts
export async function loader({ request }: Route.LoaderArgs) {
  return { firstTouchSource: readFirstTouchSource(request) }
}
```

Read it with `useRouteLoaderData('root')`. If the button only exists on one page, put the
loader on that route instead.

### Build the Cal.com URL

```ts
function calUrl(firstTouchSource: string | null) {
  const url = new URL('https://cal.com/luhive/demo') // TODO: confirm real booking link
  if (firstTouchSource) url.searchParams.set('source', firstTouchSource)
  return url.toString()
}
```

Cal.com fills its hidden `source` booking question from that query parameter.

**If the site uses the Cal.com embed** rather than a plain link, pass the same value through
the embed's prefill config instead of the URL. The field identifier is still `source`.

**Verify:** set the cookie by hand in DevTools on luhive.com, reload, confirm the demo link
carries `?source=tools-ics-generator`. Then make a real test booking and check the value
appears on it in Cal.com.

---

## 4. Sitemap

Add the tool URL to the main sitemap:

```xml
<url>
  <loc>https://luhive.com/tools/ics-generator</loc>
  <lastmod>2026-08-02</lastmod>
</url>
```

Static file in `public/` → edit directly. Generated by a route → add to whatever list feeds
it. Do not create a second sitemap on the tools site.

---

## Definition of done

- [ ] `curl -sI https://luhive.com/tools/ics-generator` returns 200 and serves the tool
- [ ] Tool assets load, no 404s or MIME type errors in the console
- [ ] `luhive.com/tools` redirects to the generator
- [ ] Umami shows hits tagged `main` from the site and `ics-generator` from the tool
- [ ] With `lh_first_touch` set, the demo link carries `?source=tools-ics-generator`
- [ ] With no cookie, the demo link is clean and nothing errors
- [ ] A junk cookie value is rejected by the allow-list, not passed through
- [ ] Sitemap contains the tool URL

---

## Not code — do these in a browser afterwards

1. **Cal.com:** demo event type → Advanced → Booking questions → add question with
   identifier `source`, marked hidden
2. **Umami:** create funnel (URL `/tools/ics-generator` → event `tool_started` → event
   `ics_downloaded`, 30 min window) and a goal on `ics_downloaded`
3. **Search Console:** resubmit sitemap, URL Inspection on the tool URL, Request Indexing
4. **Verify** `luhive-tools.netlify.app/robots.txt` returns disallow-all

**Hold step 3** until the intern's Revision 1 changes are live. The current page still has
the old H1 and title tag.