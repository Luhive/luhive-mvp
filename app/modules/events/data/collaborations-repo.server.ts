import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";

export type Collaboration = Database["public"]["Tables"]["event_collaborations"]["Row"];
export type CollaborationInsert = Database["public"]["Tables"]["event_collaborations"]["Insert"];
export type CollaborationUpdate = Database["public"]["Tables"]["event_collaborations"]["Update"];

export type CollaborationWithCommunity = Collaboration & {
  community: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
};

/**
 * Get all collaborations for a specific event
 */
export async function getEventCollaborations(
  supabase: SupabaseClient<Database>,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      *,
      community:communities!event_collaborations_community_id_fkey (
        id,
        name,
        slug,
        logo_url
      )
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    return { collaborations: [], error };
  }

  const collaborations = (data || []).map((collab) => ({
    ...collab,
    community: Array.isArray(collab.community)
      ? collab.community[0]
      : collab.community,
  })) as CollaborationWithCommunity[];

  return { collaborations, error: null };
}

/**
 * Get all events where a community is host or co-host
 */
export async function getCommunityCollaborations(
  supabase: SupabaseClient<Database>,
  communityId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      *,
      event:events!event_collaborations_event_id_fkey (
        id,
        title,
        start_time,
        status,
        community_id
      )
    `
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    return { collaborations: [], error };
  }

  return { collaborations: data || [], error: null };
}

/**
 * Get collaboration by ID
 */
export async function getCollaborationById(
  supabase: SupabaseClient<Database>,
  collaborationId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      *,
      event:events!event_collaborations_event_id_fkey (
        id,
        title,
        start_time,
        community_id,
        created_by
      ),
      community:communities!event_collaborations_community_id_fkey (
        id,
        name,
        slug,
        logo_url,
        created_by
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (error) {
    return { collaboration: null, error };
  }

  return { collaboration: data, error: null };
}

/**
 * Invite a community to collaborate on an event
 */
export async function inviteCollaboration(
  supabase: SupabaseClient<Database>,
  eventId: string,
  coHostCommunityId: string,
  invitedBy: string
) {
  // Check if collaboration already exists
  const { data: existing } = await supabase
    .from("event_collaborations")
    .select("id")
    .eq("event_id", eventId)
    .eq("community_id", coHostCommunityId)
    .single();

  if (existing) {
    return {
      collaboration: null,
      error: { message: "Collaboration already exists", code: "PGRST116" },
    };
  }

  const { data, error } = await supabase
    .from("event_collaborations")
    .insert({
      event_id: eventId,
      community_id: coHostCommunityId,
      role: "co-host",
      status: "pending",
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { collaboration: data, error };
}

/**
 * Accept a collaboration invitation
 */
export async function acceptCollaboration(
  supabase: SupabaseClient<Database>,
  collaborationId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", collaborationId)
    .select()
    .single();

  return { collaboration: data, error };
}

/**
 * Reject a collaboration invitation
 */
export async function rejectCollaboration(
  supabase: SupabaseClient<Database>,
  collaborationId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", collaborationId)
    .select()
    .single();

  return { collaboration: data, error };
}

/**
 * Remove a collaboration (host only)
 */
export async function removeCollaboration(
  supabase: SupabaseClient<Database>,
  collaborationId: string
) {
  const { error } = await supabase
    .from("event_collaborations")
    .delete()
    .eq("id", collaborationId);

  return { error };
}

/**
 * Check if a community is the host of an event
 */
export async function isHostCommunity(
  supabase: SupabaseClient<Database>,
  eventId: string,
  communityId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select("role")
    .eq("event_id", eventId)
    .eq("community_id", communityId)
    .eq("role", "host")
    .eq("status", "accepted")
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Check if a community can update an event (only host can update)
 */
export async function canUpdateEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  communityId: string
): Promise<boolean> {
  return isHostCommunity(supabase, eventId, communityId);
}

/**
 * Get host community for an event
 */
export async function getHostCommunity(
  supabase: SupabaseClient<Database>,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      *,
      community:communities!event_collaborations_community_id_fkey (
        id,
        name,
        slug,
        logo_url
      )
    `
    )
    .eq("event_id", eventId)
    .eq("role", "host")
    .eq("status", "accepted")
    .single();

  if (error || !data) {
    return { community: null, error };
  }

  const community = Array.isArray(data.community)
    ? data.community[0]
    : data.community;

  return { community, error: null };
}

/**
 * Get co-host communities for an event
 */
export async function getCoHostCommunities(
  supabase: SupabaseClient<Database>,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .select(
      `
      *,
      community:communities!event_collaborations_community_id_fkey (
        id,
        name,
        slug,
        logo_url
      )
    `
    )
    .eq("event_id", eventId)
    .eq("role", "co-host")
    .eq("status", "accepted")
    .order("accepted_at", { ascending: true });

  if (error) {
    return { communities: [], error };
  }

  const communities = (data || []).map((collab) => ({
    ...collab,
    community: Array.isArray(collab.community)
      ? collab.community[0]
      : collab.community,
  })) as CollaborationWithCommunity[];

  return { communities, error: null };
}

/**
 * Create host collaboration record when event is created
 */
export async function createHostCollaboration(
  supabase: SupabaseClient<Database>,
  eventId: string,
  communityId: string,
  createdBy: string
) {
  const { data, error } = await supabase
    .from("event_collaborations")
    .insert({
      event_id: eventId,
      community_id: communityId,
      role: "host",
      status: "accepted",
      invited_by: createdBy,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { collaboration: data, error };
}
