import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";
import { getCommunityMemberEmails } from "~/modules/community/utils/community-members";
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
    } = body;

    if (!announcementId || !communityId || !title || !description || !communitySlug) {
      return new Response("Missing required fields", { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    const memberEmails = await getCommunityMemberEmails(communityId, serviceClient);
    if (memberEmails.length === 0) {
      return { success: true, message: "No members to notify" };
    }

    const announcementLink = `${new URL(request.url).origin}/c/${communitySlug}`;

    let successCount = 0;
    let errorCount = 0;

    for (const email of memberEmails) {
      try {
        const recipientName = email.split("@")[0];

        await sendAnnouncementNotificationEmail({
          title,
          description,
          communityName,
          announcementLink,
          recipientEmail: email,
          recipientName,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          announcementId,
        });

        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        console.error("Failed to send announcement notification to:", email, error);
        errorCount++;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

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
