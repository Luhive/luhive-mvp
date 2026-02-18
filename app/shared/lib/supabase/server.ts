import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/shared/models/database.types";
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
            headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
          );
        },
      },
    }
  );

  if (isProduction) {
    try {
      Sentry.addIntegration(
        Sentry.supabaseIntegration({
          supabaseClient: supabase,
        })
      );
    } catch (error) {
      console.warn("Failed to initialize Sentry Supabase integration:", error);
    }
  }

  return { supabase, headers };
}

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

  if (isProduction) {
    try {
      Sentry.addIntegration(
        Sentry.supabaseIntegration({
          supabaseClient: serviceClient,
        })
      );
    } catch (error) {
      console.warn(
        "Failed to initialize Sentry Supabase integration for service client:",
        error
      );
    }
  }

  return serviceClient;
}
