import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import { sendCommunityJoinNotification } from "~/shared/lib/email.server";

export async function notifyCommunityJoin(params: {
  supabase: SupabaseClient;
  communityId: string;
  memberUserId: string;
  memberEmail: string | null;
  memberName: string;
}) {
  try {
    const { data: community } = await params.supabase
      .from("communities")
      .select("name, slug")
      .eq("id", params.communityId)
      .single();

    if (!community) return;

    const serviceClient = createServiceRoleClient();
    const { data: admins } = await serviceClient
      .from("community_members")
      .select("user_id")
      .eq("community_id", params.communityId)
      .in("role", ["owner", "admin"]);

    const adminIds =
      admins?.map((a) => a.user_id).filter((id): id is string => !!id) ?? [];

    for (const adminId of adminIds) {
      try {
        const { data: adminData } =
          await serviceClient.auth.admin.getUserById(adminId);

        if (adminData?.user?.email) {
          await sendCommunityJoinNotification({
            communityName: community.name,
            communitySlug: community.slug,
            memberName: params.memberName,
            memberEmail: params.memberEmail ?? "unknown",
            ownerEmail: adminData.user.email,
            joinedAt: new Date().toLocaleString(),
          });
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } catch (emailError) {
        console.error(
          "Failed to send community join notification to admin:",
          adminId,
          emailError
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  } catch (emailError) {
    console.error("Error sending community join notification:", emailError);
  }
}
