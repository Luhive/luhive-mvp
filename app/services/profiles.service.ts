import type { Database } from "~/models/database.types";
import { createClient as createServerClient } from "~/lib/supabase.server";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfileServer(request: Request, userId: string) {
  const { supabase } = createServerClient(request);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile: data as Profile | null, error };
}

