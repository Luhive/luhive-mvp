import { createClient } from "~/shared/lib/supabase/server";
import { notifyCommunityJoin } from "~/modules/community/server/notify-community-join.server";
import type { ActionFunctionArgs } from "react-router";

export async function joinCommunityAction({ request }: ActionFunctionArgs) {
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const communityId = formData.get("communityId") as string;

  if (!communityId) {
    return { success: false, error: "Missing community ID" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to join or leave a community" };
  }

  if (intent === "join_community") {
    const { data: existingMembership } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .limit(1);

    if (existingMembership && existingMembership.length > 0) {
      return { success: true, message: "You are already a member!" };
    }

    const { error: memberError } = await supabase
      .from("community_members")
      .insert({
        user_id: user.id,
        community_id: communityId,
        role: "member",
      });

    if (memberError) {
      return { success: false, error: "Failed to join community" };
    }

    const { data: memberProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await notifyCommunityJoin({
      supabase,
      communityId,
      memberUserId: user.id,
      memberEmail: user.email ?? null,
      memberName:
        memberProfile?.full_name ||
        user.email?.split("@")[0] ||
        "A new member",
    });

    return { success: true, message: "Successfully joined the community!" };
  }

  if (intent === "leave_community") {
    const { error: deleteError } = await supabase
      .from("community_members")
      .delete()
      .eq("user_id", user.id)
      .eq("community_id", communityId);

    if (deleteError) {
      return { success: false, error: "Failed to leave community" };
    }

    return { success: true, message: "You have left the community" };
  }

  return { success: false, error: "Invalid intent" };
}
