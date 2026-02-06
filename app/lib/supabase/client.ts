import { createBrowserClient } from "@supabase/ssr";
import { Database } from "~/models/database.types";
import * as Sentry from "@sentry/react-router";

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

function createClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client requires browser environment");
  }

  // Return existing client if already created (singleton)
  if (supabaseClient) {
    return supabaseClient;
  }

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  supabaseClient = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Only add Sentry Supabase integration in production
  if (import.meta.env.PROD) {
    Sentry.addIntegration(Sentry.supabaseIntegration({ supabaseClient }));
  }

  return supabaseClient;
}

export { createClient };

