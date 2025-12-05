import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://2f1c4b440ca2827aa882c9efac853f16@o4510431984680960.ingest.de.sentry.io/4510465369309264",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  environment: import.meta.env.MODE,

  // Enable tracing for Supabase integration (10% sampling - adjust for production)
  tracesSampleRate: 0.1,
});


startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
