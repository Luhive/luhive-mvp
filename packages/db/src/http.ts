import { createClient } from "@supabase/supabase-js";

export function createHttpClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type HttpClient = ReturnType<typeof createHttpClient>;
