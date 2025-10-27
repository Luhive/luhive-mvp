import { createBrowserClient } from '@supabase/ssr'
import { Database } from "~/models/database.types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function createClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client requires browser environment");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { createClient };