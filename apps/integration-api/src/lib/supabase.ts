import { createClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export function createSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabase>;
