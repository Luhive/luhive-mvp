import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyCommunityJoin } from "~/modules/community/server/notify-community-join.server";

export async function ensureCommunityMembership({
  supabase,
  userId,
  communityId,
  userEmail,
  memberName,
  skipNotification = false,
}: {
  supabase: SupabaseClient;
  userId: string;
  communityId: string;
  userEmail?: string | null;
  memberName?: string | null;
  skipNotification?: boolean;
}): Promise<{ joined: boolean }> {
  const { data: existingMember } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (existingMember) {
    return { joined: false };
  }

  const { error: insertError } = await supabase.from("community_members").insert({
    user_id: userId,
    community_id: communityId,
    role: "member",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  if (!skipNotification) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    await notifyCommunityJoin({
      supabase,
      communityId,
      memberUserId: userId,
      memberEmail: userEmail ?? null,
      memberName:
        memberName ||
        profile?.full_name ||
        userEmail?.split("@")[0] ||
        "A new member",
    });
  }

  return { joined: true };
}
