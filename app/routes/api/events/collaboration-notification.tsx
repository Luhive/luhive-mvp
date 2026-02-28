import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";
import { getCommunityMemberEmails } from "~/modules/community/utils/community-members";
import { sendNewCollaborationEventEmail, sendEventRegistrationNotificationEmail } from "~/shared/lib/email.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      type,
      eventId,
      hostCommunityId,
      coHostCommunityId,
      eventTitle,
      eventDate,
      eventTime,
      eventLink,
      locationAddress,
      onlineMeetingLink,
      // For registration notifications
      registrantName,
      registrantEmail,
      hostCommunityName,
      coHostCommunityNames,
    } = body;

    const serviceClient = createServiceRoleClient();

    if (type === "collaboration-accepted-new-event") {
      // Notify both host and co-host community members when collaboration is accepted on NEW event
      // Send to all co-host community members
      if (coHostCommunityId) {
        const coHostEmails = await getCommunityMemberEmails(coHostCommunityId, serviceClient);
        
        const { data: coHostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", coHostCommunityId)
          .single();
        
        const { data: hostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", hostCommunityId)
          .single();

        const coHostName = coHostCommunity?.name || "Co-host Community";
        const hostName = hostCommunity?.name || "Host Community";

        for (const email of coHostEmails) {
          try {
            const recipientName = email.split("@")[0];
            await sendNewCollaborationEventEmail({
              eventTitle,
              hostCommunityName: hostName,
              coHostCommunityName: coHostName,
              eventDate,
              eventTime,
              eventLink,
              recipientEmail: email,
              recipientName,
              isNewEvent: true,
              locationAddress,
              onlineMeetingLink,
            });
          } catch (error) {
            console.error("Failed to send collaboration notification to co-host member:", email, error);
          }
        }
      }

      // Send to all host community members
      if (hostCommunityId) {
        const hostEmails = await getCommunityMemberEmails(hostCommunityId, serviceClient);
        
        const { data: coHostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", coHostCommunityId)
          .single();
        
        const { data: hostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", hostCommunityId)
          .single();

        const coHostName = coHostCommunity?.name || "Co-host Community";
        const hostName = hostCommunity?.name || "Host Community";

        for (const email of hostEmails) {
          try {
            const recipientName = email.split("@")[0];
            await sendNewCollaborationEventEmail({
              eventTitle,
              hostCommunityName: hostName,
              coHostCommunityName: coHostName,
              eventDate,
              eventTime,
              eventLink,
              recipientEmail: email,
              recipientName,
              isNewEvent: true,
              locationAddress,
              onlineMeetingLink,
            });
          } catch (error) {
            console.error("Failed to send collaboration notification to host member:", email, error);
          }
        }
      }

      return { success: true, message: "Collaboration notifications sent" };
    }

    if (type === "collaboration-accepted-existing-event") {
      // Notify only co-host community members when collaboration is accepted on EXISTING event
      if (coHostCommunityId) {
        const coHostEmails = await getCommunityMemberEmails(coHostCommunityId, serviceClient);
        
        const { data: coHostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", coHostCommunityId)
          .single();
        
        const { data: hostCommunity } = await serviceClient
          .from("communities")
          .select("name")
          .eq("id", hostCommunityId)
          .single();

        const coHostName = coHostCommunity?.name || "Co-host Community";
        const hostName = hostCommunity?.name || "Host Community";

        for (const email of coHostEmails) {
          try {
            const recipientName = email.split("@")[0];
            await sendNewCollaborationEventEmail({
              eventTitle,
              hostCommunityName: hostName,
              coHostCommunityName: coHostName,
              eventDate,
              eventTime,
              eventLink,
              recipientEmail: email,
              recipientName,
              isNewEvent: false,
              locationAddress,
              onlineMeetingLink,
            });
          } catch (error) {
            console.error("Failed to send collaboration notification to co-host member:", email, error);
          }
        }
      }

      return { success: true, message: "Collaboration notifications sent" };
    }

    if (type === "registration-notification") {
      // Get host community owner/admin user IDs
      const { data: hostAdmins } = await serviceClient
        .from("community_members")
        .select("user_id")
        .eq("community_id", hostCommunityId)
        .in("role", ["owner", "admin"]);

      // Get co-host community owner/admin user IDs
      let coHostAdminIds: string[] = [];
      if (coHostCommunityNames && coHostCommunityNames.length > 0) {
        // Get co-host community IDs from names
        const { data: coHostCommunities } = await serviceClient
          .from("communities")
          .select("id")
          .in("name", coHostCommunityNames);

        if (coHostCommunities && coHostCommunities.length > 0) {
          const coHostIds = coHostCommunities.map((c) => c.id);
          const { data: coHostAdmins } = await serviceClient
            .from("community_members")
            .select("user_id")
            .in("community_id", coHostIds)
            .in("role", ["owner", "admin"]);
          
          if (coHostAdmins) {
            coHostAdminIds = coHostAdmins
              .map((a) => a.user_id)
              .filter((id): id is string => !!id);
          }
        }
      }

      // Get all unique admin user IDs
      let allAdminIds: string[] = [];
      if (hostAdmins) {
        allAdminIds = hostAdmins
          .map((a) => a.user_id)
          .filter((id): id is string => !!id);
      }
      allAdminIds = [...new Set([...allAdminIds, ...coHostAdminIds])];

      // Get emails for these users via auth.admin
      for (const adminId of allAdminIds) {
        try {
          const { data: ownerData } = await serviceClient.auth.admin.getUserById(adminId);
          if (ownerData?.user?.email) {
            // Get profile for full name
            const { data: profile } = await serviceClient
              .from("profiles")
              .select("full_name")
              .eq("id", adminId)
              .maybeSingle();

            await sendEventRegistrationNotificationEmail({
              eventTitle,
              registrantName,
              registrantEmail,
              hostCommunityName,
              coHostCommunityNames,
              eventDate,
              eventTime,
              eventLink,
              recipientEmail: ownerData.user.email,
              recipientName: profile?.full_name || ownerData.user.email.split("@")[0],
            });
          }
        } catch (error) {
          console.error("Failed to send registration notification to admin:", adminId, error);
        }
      }

      return { success: true, message: "Registration notifications sent" };
    }

    return new Response("Invalid notification type", { status: 400 });
  } catch (error) {
    console.error("Error in collaboration-notification API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
