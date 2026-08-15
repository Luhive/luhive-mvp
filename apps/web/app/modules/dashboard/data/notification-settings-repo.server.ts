import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/shared/models/database.types";

type ServiceClient = SupabaseClient<Database>;

export async function getNotifyRegistrations(
  supabase: ServiceClient,
  communityId: string,
  userId: string,
): Promise<{ notifyRegistrations: boolean; error: Error | null }> {
  const { data, error } = await supabase
    .from("community_members")
    .select("notify_registrations")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { notifyRegistrations: true, error };
  }

  return {
    notifyRegistrations: data?.notify_registrations ?? true,
    error: null,
  };
}

export async function updateNotifyRegistrations(
  supabase: ServiceClient,
  {
    communityId,
    userId,
    notifyRegistrations,
  }: {
    communityId: string;
    userId: string;
    notifyRegistrations: boolean;
  },
): Promise<{ error: Error | null }> {
  const { data, error } = await supabase
    .from("community_members")
    .update({ notify_registrations: notifyRegistrations })
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    return { error };
  }

  if (!data || data.length === 0) {
    return { error: new Error("Membership not found") };
  }

  return { error: null };
}
