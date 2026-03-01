import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";
import { getCommunityMemberEmails } from "~/modules/community/utils/community-members";
import { sendNewEventNotificationEmail } from "~/shared/lib/email.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      eventId,
      communityId,
      eventTitle,
      eventDate,
      eventTime,
      eventLink,
      locationAddress,
      onlineMeetingLink,
    } = body;

    if (!eventId || !communityId || !eventTitle || !eventDate || !eventTime || !eventLink) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Create service role client for server-to-server calls
    const serviceClient = createServiceRoleClient();

    // Get all community member emails using service client
    const memberEmails = await getCommunityMemberEmails(communityId, serviceClient);

    if (memberEmails.length === 0) {
      console.log("No community members to notify for new event:", eventId);
      return { success: true, message: "No members to notify" };
    }

    // Get community name using service client
    const { data: community } = await serviceClient
      .from("communities")
      .select("name")
      .eq("id", communityId)
      .maybeSingle();

    const communityName = community?.name || "Unknown Community";

    // Send emails to all community members
    let successCount = 0;
    let errorCount = 0;

    for (const email of memberEmails) {
      try {
        const recipientName = email.split("@")[0];

        await sendNewEventNotificationEmail({
          eventTitle,
          communityName,
          eventDate,
          eventTime,
          eventLink,
          recipientEmail: email,
          recipientName,
          locationAddress,
          onlineMeetingLink,
        });
        successCount++;
        // Add delay to avoid rate limiting (Resend allows 2 requests per second)
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (error) {
        console.error("Failed to send new event notification to:", email, error);
        errorCount++;
        // Still add delay even on error to respect rate limit
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    console.log(`New event notification: ${successCount} sent, ${errorCount} failed for event ${eventId}`);

    return {
      success: true,
      sent: successCount,
      failed: errorCount,
    };
  } catch (error) {
    console.error("Error in new-event-notification API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
