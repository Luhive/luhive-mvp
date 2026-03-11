import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";
import { getCommunityMemberEmailsWithIds } from "~/modules/community/utils/community-members";
import { sendAnnouncementNotificationEmail } from "~/shared/lib/email.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      announcementId,
      communityId,
      communityName,
      communitySlug,
      title,
      description,
      imageUrls,
      createdAt,
      communityLogo,
      logo_url,
    } = body;

    if (!announcementId || !communityId || !title || !description || !communitySlug) {
      return new Response("Missing required fields", { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    let resolvedCommunityLogo = communityLogo ?? logo_url;
    if (!resolvedCommunityLogo) {
      const { data: communityData } = await (serviceClient as any)
        .from("communities")
        .select("logo_url")
        .eq("id", communityId)
        .maybeSingle();

      resolvedCommunityLogo = communityData?.logo_url ?? undefined;
    }

    const memberEmailsWithIds = await getCommunityMemberEmailsWithIds(communityId, serviceClient);
    if (memberEmailsWithIds.length === 0) {
      return { success: true, message: "No members to notify" };
    }

    const announcementLink = `${new URL(request.url).origin}/c/${communitySlug}`;

    const payloads = memberEmailsWithIds.map(({ email, userId }) => ({
      title,
      description,
      communityName,
      announcementLink,
      recipientEmail: email,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      createdAt,
      communityLogo: resolvedCommunityLogo,
      announcementId,
      userId,
    }));

    const { successCount, errorCount } = await sendAnnouncementNotificationEmail(
      payloads
    );

    await (serviceClient as any)
      .from("community_announcements")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", announcementId);

    return { success: true, sent: successCount, failed: errorCount };
  } catch (error) {
    console.error("Error in announcement notification API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
