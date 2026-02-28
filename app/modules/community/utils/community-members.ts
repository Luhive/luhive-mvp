import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";

type ServiceClient = SupabaseClient<Database>;

/**
 * Get all member emails from a community (including all roles)
 * Uses service role client to fetch emails from auth.users
 */
export async function getCommunityMemberEmails(
  communityId: string,
  supabaseClient?: ServiceClient
): Promise<string[]> {
  const supabase = supabaseClient || createServiceRoleClient();

  // Get all community members
  const { data: members, error } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId);

  if (error || !members) {
    console.error("Error fetching community members:", error);
    return [];
  }

  if (members.length === 0) {
    return [];
  }

  // Get user IDs (filter out null values)
  const userIds = members
    .map((m) => m.user_id)
    .filter((id): id is string => id !== null && id !== undefined);

  if (userIds.length === 0) {
    return [];
  }

  // Get emails from auth.users table
  const emails: string[] = [];

  for (const userId of userIds) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError) {
        console.error("Error fetching user:", userId, userError);
        continue;
      }

      if (userData?.user?.email) {
        emails.push(userData.user.email);
      }
    } catch (err) {
      console.error("Error fetching user email for:", userId, err);
    }
  }

  return [...new Set(emails)];
}

/**
 * Get owner and admin emails from a community
 * Uses service role client to fetch emails from auth.users
 */
export async function getCommunityOwnerAdminEmails(
  communityId: string,
  supabaseClient?: ServiceClient
): Promise<string[]> {
  const supabase = supabaseClient || createServiceRoleClient();

  // Get community owners and admins
  const { data: members, error } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .in("role", ["owner", "admin"]);

  if (error || !members) {
    console.error("Error fetching community owners/admins:", error);
    return [];
  }

  if (members.length === 0) {
    // Fallback: get community created_by as owner
    const { data: community } = await supabase
      .from("communities")
      .select("created_by")
      .eq("id", communityId)
      .single();

    if (community?.created_by) {
      const { data: userData } = await supabase.auth.admin.getUserById(community.created_by);
      if (userData?.user?.email) {
        return [userData.user.email];
      }
    }
    return [];
  }

  // Get user IDs (filter out null values)
  const userIds = members
    .map((m) => m.user_id)
    .filter((id): id is string => id !== null && id !== undefined);

  if (userIds.length === 0) {
    return [];
  }

  // Get emails from auth.users table
  const emails: string[] = [];

  for (const userId of userIds) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError) {
        console.error("Error fetching user:", userId, userError);
        continue;
      }

      if (userData?.user?.email) {
        emails.push(userData.user.email);
      }
    } catch (err) {
      console.error("Error fetching user email for:", userId, err);
    }
  }

  return [...new Set(emails)];
}

/**
 * Get all communities for an event (host + all accepted co-hosts)
 * Uses service role client by default for server-to-server calls
 */
export async function getEventCollaboratingCommunities(
  eventId: string,
  supabaseClient?: ServiceClient
): Promise<{
  communityId: string;
  communityName: string;
  role: string;
  isHost: boolean;
}[]> {
  const supabase = supabaseClient || createServiceRoleClient();

  const { data: collaborations, error } = await supabase
    .from("event_collaborations")
    .select("id, community_id, role, status, community:communities!event_collaborations_community_id_fkey (id, name)")
    .eq("event_id", eventId)
    .eq("status", "accepted");

  if (error || !collaborations) {
    console.error("Error fetching event collaborations:", error);
    return [];
  }

  const result: {
    communityId: string;
    communityName: string;
    role: string;
    isHost: boolean;
  }[] = [];

  for (const collab of collaborations) {
    const communityData = collab.community as { name: string } | null;
    const communityName = communityData?.name;
    
    if (collab.community_id && communityName) {
      result.push({
        communityId: collab.community_id,
        communityName,
        role: collab.role,
        isHost: collab.role === "host",
      });
    }
  }

  return result;
}
