import type { Database } from "~/models/database.types";
import { createClient as createBrowserClient } from "~/lib/supabase.client";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export async function getCommunityBySlugClient(slug: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  return { community: data as Community | null, error };
}

export async function getCommunitiesClient(options?: { includeHidden?: boolean }) {
  const supabase = createBrowserClient();

  let query = supabase.from("communities").select("*");

  // Filter by is_show unless includeHidden is true
  if (!options?.includeHidden) {
    query = query.eq("is_show", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  return { communities: (data || []) as Community[], error };
}

