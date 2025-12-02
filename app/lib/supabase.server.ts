import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/models/database.types";
import * as Sentry from "@sentry/react-router";

export function createClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
            (cookie) => ({
              name: cookie.name,
              value: cookie.value || "",
            })
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );

  // Add Sentry Supabase integration for this request's client
  Sentry.addIntegration(
    Sentry.supabaseIntegration({ supabaseClient: supabase })
  );

  return { supabase, headers };
}

// Service role client for admin operations (bypasses RLS)
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const serviceClient = createSupabaseClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Add Sentry Supabase integration for service role client
  Sentry.addIntegration(
    Sentry.supabaseIntegration({ supabaseClient: serviceClient })
  );

  return serviceClient;
}
