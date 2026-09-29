import type { SupabaseClient } from "@supabase/supabase-js";
import { isPaidTicketingEnabled } from "@luhive/domain/v1/paid-ticketing-flag";
import type { Database } from "~/shared/models/database.types";

export async function isPaidTicketingEnabledForCommunity(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("communities")
    .select("settings")
    .eq("id", communityId)
    .maybeSingle();

  return isPaidTicketingEnabled(data?.settings);
}
