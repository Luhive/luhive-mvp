import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import { getCommunityMemberEmails } from "~/modules/community/utils/community-members";
import { sendNewEventNotificationEmail } from "~/shared/lib/email.server";

export interface NotifyNewEventParams {
  eventId: string;
  communityId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
}

export async function notifyNewEvent(params: NotifyNewEventParams): Promise<void> {
  const {
    eventId,
    communityId,
    eventTitle,
    eventDate,
    eventTime,
    eventLink,
    locationAddress,
    onlineMeetingLink,
  } = params;

  const serviceClient = createServiceRoleClient();

  const memberEmails = await getCommunityMemberEmails(communityId, serviceClient);

  if (memberEmails.length === 0) {
    console.log("No community members to notify for new event:", eventId);
    return;
  }

  const { data: community } = await serviceClient
    .from("communities")
    .select("name")
    .eq("id", communityId)
    .maybeSingle();

  const communityName = community?.name || "Unknown Community";

  const payloads = memberEmails.map((email) => ({
    eventTitle,
    communityName,
    eventDate,
    eventTime,
    eventLink,
    recipientEmail: email,
    recipientName: email.split("@")[0],
    locationAddress,
    onlineMeetingLink,
  }));

  const { successCount, errorCount } = await sendNewEventNotificationEmail(payloads);

  console.log(
    `New event notification: ${successCount} sent, ${errorCount} failed for event ${eventId}`
  );
}
