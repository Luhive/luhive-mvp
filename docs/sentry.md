## 🗺️ Sentry Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                    │
│  ┌──────────────────┐    ┌────────────────────┐                     │
│  │  vite.config.ts  │───▶│react-router.config │                     │
│  │  (Sentry plugin) │    │  (Source maps)     │                     │
│  └──────────────────┘    └────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RUNTIME - SERVER                              │
│  ┌──────────────────────┐    ┌──────────────────┐                   │
│  │ instrument.server.mjs│───▶│ entry.server.tsx │                   │
│  │ (Initialize Sentry)  │    │ (Handle requests)│                   │
│  └──────────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RUNTIME - CLIENT (Browser)                    │
│  ┌──────────────────────┐    ┌──────────────────┐                   │
│  │  entry.client.tsx    │───▶│     root.tsx     │                   │
│  │ (Initialize Sentry)  │    │ (Error boundary) │                   │
│  └──────────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File-by-File Explanation

### 1. `instrument.server.mjs` — Server-Side Sentry Initialization

```10:10:instrument.server.mjs
Sentry.init({
  dsn: "...",
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || "development",
});
```

**Purpose:** Initializes Sentry on the **Node.js server** before any other code runs.

**Why it's needed:**
- Must be loaded **first** before any application code
- That's why your `package.json` uses `NODE_OPTIONS='--import ./instrument.server.mjs'` — this tells Node.js to import this file before anything else
- Captures server-side errors, unhandled rejections, and performance data

**Key Point:** The `--import` flag ensures Sentry is initialized at the very start of the Node.js process.

---

### 2. `entry.client.tsx` — Client-Side (Browser) Sentry Initialization

```6:13:app/entry.client.tsx
Sentry.init({
  dsn: "https://2f1c4b440ca2827aa882c9efac853f16@o4510431984680960.ingest.de.sentry.io/4510465369309264",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  environment: import.meta.env.MODE,
});
```

**Purpose:** Initializes Sentry in the **browser** when your app hydrates.

**Why it's needed:**
- Runs in the user's browser, not on your server
- Captures JavaScript errors, unhandled promise rejections, and user interactions
- Uses `import.meta.env.MODE` (Vite's way to get the environment) instead of `process.env`

**Key Point:** This is separate from server initialization because browser and server are completely different JavaScript environments.

---

### 3. `entry.server.tsx` — Server Request Handling with Sentry

```14:24:app/entry.server.tsx
const handleRequest = Sentry.createSentryHandleRequest({
  ServerRouter,
  renderToPipeableStream,
  createReadableStreamFromReadable,
 });

 export default handleRequest;

 export const handleError = Sentry.createSentryHandleError({
  logErrors: false
 });
```

**Purpose:** Wraps your server-side request handler to automatically capture errors during SSR (Server-Side Rendering).

**Why it's needed:**
- `createSentryHandleRequest` — Wraps the SSR process so Sentry can:
  - Track the request as a transaction
  - Capture any errors during rendering
  - Associate errors with the specific route/request
  
- `createSentryHandleError` — Catches unhandled errors that occur in loaders, actions, or during rendering

**Key Point:** Without this, server-side errors wouldn't be properly associated with requests or captured automatically.

---

### 4. `vite.config.ts` — Sentry Vite Plugin

```12:19:vite.config.ts
const sentryConfig: SentryReactRouterBuildOptions = {
  org: "luhive",
  project: "luhive",
  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // ...
};
```

```74:74:vite.config.ts
      sentryReactRouter(sentryConfig, config),
```

**Purpose:** Integrates Sentry into your **build process**.

**Why it's needed:**
- Automatically injects Sentry's release tracking
- Generates and prepares source maps for upload
- Adds debugging information to your bundles
- Enables proper stack trace deobfuscation in Sentry dashboard

**Key Point:** This runs at **build time**, not runtime. It modifies your bundled code.

---

### 5. `react-router.config.ts` — Source Maps Upload

```11:15:react-router.config.ts
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    // ...
    // Call this at the end of the hook
    +(await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest }));
  },
```

**Purpose:** Uploads source maps to Sentry after the build completes.

**Why it's needed:**
- Your production code is minified (e.g., `a.js` with variable names like `t`, `n`, etc.)
- Source maps translate minified code back to your original source code
- When an error occurs, Sentry uses source maps to show you the **actual file and line number**, not the minified version

**Key Point:** Without source maps, your error stack traces in Sentry would be unreadable minified code.

⚠️ **Note:** There's a typo in your file — you have a `+` before `await`:
```typescript
+(await sentryOnBuildEnd(...))  // ❌ The + is unnecessary
await sentryOnBuildEnd(...)     // ✅ Should be just this
```

---

### 6. `root.tsx` — Error Boundary with Sentry Capture

```56:74:app/root.tsx
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // ...
  } else if (import.meta.env.DEV && error && error instanceof ErrorComponent) {
    details = (error as Error).message || details;
    stack = (error as Error).stack;
    Sentry.captureException(error);
  }
  // ...
}
```

**Purpose:** Manually captures React errors that bubble up to the root error boundary.

**Why it's needed:**
- React error boundaries catch rendering errors
- Without explicit `Sentry.captureException()`, some errors might not be sent to Sentry
- Acts as a fallback for client-side errors

**⚠️ Issue in your code:** You're only capturing errors in DEV mode! The Sentry capture should be outside the `import.meta.env.DEV` check:

```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  // Capture ALL non-404 errors to Sentry (in all environments)
  if (!isRouteErrorResponse(error)) {
    Sentry.captureException(error);
  }

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404
      ? "The requested page could not be found."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message || details;
    stack = error.stack;
  }

  return <ErrorComponent message={message} details={details} stack={stack} />;
}
```

---

## 📊 Summary Table

| File | When it runs | Environment | What it does |
|------|-------------|-------------|--------------|
| `instrument.server.mjs` | App startup | Server (Node.js) | Initializes Sentry SDK before anything else |
| `entry.client.tsx` | App hydration | Browser | Initializes Sentry SDK in the browser |
| `entry.server.tsx` | Every request | Server | Wraps SSR to capture request errors |
| `vite.config.ts` | Build time | Build tooling | Adds Sentry plugin & prepares source maps |
| `react-router.config.ts` | Build end | Build tooling | Uploads source maps to Sentry |
| `root.tsx` | Runtime (errors) | Browser | Catches & reports React render errors |

---

## 🔑 Key Takeaways

1. **Two separate Sentry instances** — One for server (`instrument.server.mjs`), one for browser (`entry.client.tsx`)

2. **Build-time vs Runtime** — Vite config and React Router config handle source maps at build time; the rest runs at runtime

3. **Source maps are crucial** — They let you see actual file names and line numbers in Sentry instead of minified gibberish

4. **The `--import` flag** — In your npm scripts, this ensures server Sentry loads first

Let me know if you want me to clarify any specific part further!