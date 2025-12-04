import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/models/database.types";
import * as Sentry from "@sentry/react-router";

const isProduction = process.env.NODE_ENV === "production";

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

  // Add Sentry Supabase integration for error tracking and performance monitoring
  if (isProduction) {
    try {
      Sentry.addIntegration(
        Sentry.supabaseIntegration({ 
          supabaseClient: supabase,
          // This integration automatically captures:
          // - Database query errors
          // - Authentication errors  
          // - Real-time subscription errors
          // - Performance traces for database operations
        })
      );
    } catch (error) {
      // Fallback if Sentry integration fails
      console.warn("Failed to initialize Sentry Supabase integration:", error);
    }
  }

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

  // Add Sentry Supabase integration for service role operations
  if (isProduction) {
    try {
      Sentry.addIntegration(
        Sentry.supabaseIntegration({ 
          supabaseClient: serviceClient,
          // Service role operations are also monitored for:
          // - Admin operation errors
          // - Bulk operation performance
          // - RLS bypass operation tracking
        })
      );
    } catch (error) {
      // Fallback if Sentry integration fails
      console.warn("Failed to initialize Sentry Supabase integration for service client:", error);
    }
  }

  return serviceClient;
}
