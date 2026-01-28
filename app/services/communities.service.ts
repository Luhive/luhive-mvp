import type { Database } from "~/models/database.types";
import { createClient as createServerClient } from "~/lib/supabase.server";
import { createClient as createBrowserClient } from "~/lib/supabase.client";

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

export async function getCommunityBySlugClient(slug: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  return { community: data as Community | null, error };
}

export async function getCommunitiesServer(request: Request) {
  const { supabase } = createServerClient(request);

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

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

