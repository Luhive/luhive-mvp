import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";
import type { CommunityMemberRole } from "~/modules/dashboard/model/dashboard-types";

type ServiceClient = SupabaseClient<Database>;

export type CommunityMemberRow = {
  id: string;
  community_id: string | null;
  role: string | null;
};

export async function getMemberById(
  supabase: ServiceClient,
  memberId: string,
  communityId: string,
) {
  const { data, error } = await supabase
    .from("community_members")
    .select("id, community_id, role")
    .eq("id", memberId)
    .eq("community_id", communityId)
    .single();

  if (error || !data) {
    return { member: null, error: error ?? new Error("Member not found") };
  }

  return { member: data as CommunityMemberRow, error: null };
}

export async function updateMemberRole(
  supabase: ServiceClient,
  {
    memberId,
    communityId,
    role,
  }: {
    memberId: string;
    communityId: string;
    role: Extract<CommunityMemberRole, "member" | "admin">;
  },
) {
  const { error } = await supabase
    .from("community_members")
    .update({ role })
    .eq("id", memberId)
    .eq("community_id", communityId);

  return { error };
}
