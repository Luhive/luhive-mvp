import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";
import {
  inviteCollaboration,
  acceptCollaboration,
  rejectCollaboration,
  removeCollaboration,
  getCollaborationById,
  isHostCommunity,
  getHostCommunity,
} from "~/modules/events/data/collaborations-repo.server";
import { sendCollaborationInviteEmail, sendCollaborationAcceptedEmail } from "~/shared/lib/email.server";

export type CollaborationActionData = {
  success?: boolean;
  error?: string;
  collaboration?: unknown;
};

/**
 * Check if user is owner/admin of a community
 */
async function isCommunityOwnerOrAdmin(
  supabase: ReturnType<typeof createClient>["supabase"],
  communityId: string,
  userId: string
): Promise<boolean> {
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single();

  if (community?.created_by === userId) {
    return true;
  }

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single();

  return membership?.role === "owner" || membership?.role === "admin";
}

export async function collaborationAction({
  request,
  params,
}: ActionFunctionArgs): Promise<CollaborationActionData | Response> {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const eventId = (params as { eventId?: string }).eventId;
  const slug = (params as { slug?: string }).slug;

  if (!eventId) {
    return { success: false, error: "Event ID required" };
  }

  // Get event and verify it exists
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, community_id, created_by")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Event not found" };
  }

  // Get host community
  const { community: hostCommunity, error: hostError } = await getHostCommunity(
    supabase,
    eventId
  );

  if (hostError || !hostCommunity) {
    return { success: false, error: "Host community not found" };
  }

  if (intent === "invite-collaboration") {
    // Only host community owners/admins can invite
    const canInvite = await isHostCommunity(supabase, eventId, event.community_id);
    if (!canInvite) {
      // Check if user is owner/admin of host community
      const isOwner = await isCommunityOwnerOrAdmin(
        supabase,
        event.community_id,
        user.id
      );
      if (!isOwner) {
        return { success: false, error: "Only host community can invite collaborators" };
      }
    }

    const coHostCommunityId = formData.get("coHostCommunityId") as string;
    if (!coHostCommunityId) {
      return { success: false, error: "Co-host community ID required" };
    }

    // Prevent self-invitation
    if (coHostCommunityId === event.community_id) {
      return { success: false, error: "Cannot invite your own community" };
    }

    // Verify co-host community exists
    const { data: coHostCommunity, error: coHostError } = await supabase
      .from("communities")
      .select("id, name, slug, created_by")
      .eq("id", coHostCommunityId)
      .single();

    if (coHostError || !coHostCommunity) {
      return { success: false, error: "Co-host community not found" };
    }

    // Invite collaboration
    const { collaboration, error: inviteError } = await inviteCollaboration(
      supabase,
      eventId,
      coHostCommunityId,
      user.id
    );

    if (inviteError || !collaboration) {
      return {
        success: false,
        error: inviteError?.message || "Failed to invite collaboration",
      };
    }

    // Send invitation email to co-host community owner
    try {
      const serviceClient = createServiceRoleClient();
      const { data: ownerData } = await serviceClient.auth.admin.getUserById(
        coHostCommunity.created_by
      );

      if (ownerData?.user?.email) {
        const { data: hostCommunityData } = await supabase
          .from("communities")
          .select("name, slug")
          .eq("id", event.community_id)
          .single();

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const inviteLink = `${new URL(request.url).origin}/c/${coHostCommunity.slug}/collaboration-invite/${collaboration.id}`;
        const eventLink = `${new URL(request.url).origin}/c/${slug || hostCommunityData?.slug}/events/${eventId}`;

        await sendCollaborationInviteEmail({
          eventTitle: event.title,
          hostCommunityName: hostCommunityData?.name || "Unknown Community",
          coHostCommunityName: coHostCommunity.name,
          recipientEmail: ownerData.user.email,
          inviteLink,
          eventLink,
          invitedByName: userProfile?.full_name || user.email?.split("@")[0] || "Someone",
        });
      }
    } catch (emailError) {
      console.error("Failed to send collaboration invite email:", emailError);
      // Don't fail the request if email fails
    }

    return { success: true, collaboration };
  }

  if (intent === "accept-collaboration") {
    const collaborationId = formData.get("collaborationId") as string;
    if (!collaborationId) {
      return { success: false, error: "Collaboration ID required" };
    }

    // Get collaboration
    const { collaboration, error: collabError } = await getCollaborationById(
      supabase,
      collaborationId
    );

    if (collabError || !collaboration) {
      return { success: false, error: "Collaboration not found" };
    }

    // Verify user is owner/admin of co-host community
    const isOwner = await isCommunityOwnerOrAdmin(
      supabase,
      collaboration.community_id,
      user.id
    );

    if (!isOwner) {
      return {
        success: false,
        error: "Only community owners can accept collaborations",
      };
    }

    // Accept collaboration
    const { collaboration: acceptedCollab, error: acceptError } =
      await acceptCollaboration(supabase, collaborationId);

    if (acceptError || !acceptedCollab) {
      return {
        success: false,
        error: acceptError?.message || "Failed to accept collaboration",
      };
    }

    // Send acceptance email to host community owner
    try {
      const serviceClient = createServiceRoleClient();
      const eventData = collaboration.event as { id: string; title: string; community_id: string; created_by: string };
      const { data: hostCommunityData } = await supabase
        .from("communities")
        .select("name, slug, created_by")
        .eq("id", eventData.community_id)
        .single();

      if (hostCommunityData?.created_by) {
        const { data: ownerData } = await serviceClient.auth.admin.getUserById(
          hostCommunityData.created_by
        );

        if (ownerData?.user?.email) {
          const communityData = collaboration.community as { name: string; slug: string };
          const eventLink = `${new URL(request.url).origin}/c/${hostCommunityData.slug}/events/${eventData.id}`;

          await sendCollaborationAcceptedEmail({
            eventTitle: eventData.title,
            hostCommunityName: hostCommunityData.name,
            coHostCommunityName: communityData.name,
            recipientEmail: ownerData.user.email,
            eventLink,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send collaboration accepted email:", emailError);
      // Don't fail the request if email fails
    }

    return { success: true, collaboration: acceptedCollab };
  }

  if (intent === "reject-collaboration") {
    const collaborationId = formData.get("collaborationId") as string;
    if (!collaborationId) {
      return { success: false, error: "Collaboration ID required" };
    }

    // Get collaboration
    const { collaboration, error: collabError } = await getCollaborationById(
      supabase,
      collaborationId
    );

    if (collabError || !collaboration) {
      return { success: false, error: "Collaboration not found" };
    }

    // Verify user is owner/admin of co-host community
    const isOwner = await isCommunityOwnerOrAdmin(
      supabase,
      collaboration.community_id,
      user.id
    );

    if (!isOwner) {
      return {
        success: false,
        error: "Only community owners can reject collaborations",
      };
    }

    // Reject collaboration
    const { collaboration: rejectedCollab, error: rejectError } =
      await rejectCollaboration(supabase, collaborationId);

    if (rejectError || !rejectedCollab) {
      return {
        success: false,
        error: rejectError?.message || "Failed to reject collaboration",
      };
    }

    return { success: true, collaboration: rejectedCollab };
  }

  if (intent === "remove-collaboration") {
    const collaborationId = formData.get("collaborationId") as string;
    if (!collaborationId) {
      return { success: false, error: "Collaboration ID required" };
    }

    // Only host community can remove
    const canInvite = await isHostCommunity(supabase, eventId, event.community_id);
    if (!canInvite) {
      const isOwner = await isCommunityOwnerOrAdmin(
        supabase,
        event.community_id,
        user.id
      );
      if (!isOwner) {
        return {
          success: false,
          error: "Only host community can remove collaborations",
        };
      }
    }

    // Remove collaboration
    const { error: removeError } = await removeCollaboration(
      supabase,
      collaborationId
    );

    if (removeError) {
      return {
        success: false,
        error: removeError.message || "Failed to remove collaboration",
      };
    }

    return { success: true };
  }

  return { success: false, error: "Invalid intent" };
}
