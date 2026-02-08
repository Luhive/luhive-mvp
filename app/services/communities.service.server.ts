import type { Database } from "~/models/database.types";
import { createClient as createServerClient } from "~/lib/supabase.server";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];

export async function getCommunityBySlugServer(request: Request, slug: string) {
  const { supabase, headers } = createServerClient(request);

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  return { community: data as Community | null, error, headers };
}

export async function getCommunitiesServer(
  request: Request,
  options?: { includeHidden?: boolean }
) {
  const { supabase } = createServerClient(request);

  let query = supabase.from("communities").select("*");

  // Filter by is_show unless includeHidden is true
  if (!options?.includeHidden) {
    query = query.eq("is_show", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  return { communities: (data || []) as Community[], error };
}

export async function getCommunityMembersServer(
  request: Request,
  communityId: string
) {
  const { supabase } = createServerClient(request);

  const { data, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId);

  return { members: (data || []) as CommunityMember[], error };
}
