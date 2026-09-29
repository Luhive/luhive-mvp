import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidTicketPriceMinor } from "@luhive/domain/v1/money";
import type { Database } from "~/shared/models/database.types";
import { hasOpenOrPaidTicketOrders } from "~/modules/events/data/ticket-orders-repo.server";
import { isPaidTicketingEnabledForCommunity } from "~/modules/events/server/is-paid-ticketing-enabled-for-community.server";

type ResolveEventPriceInput = {
  supabase: SupabaseClient<Database>;
  communityId: string;
  requestedPriceMinor: unknown;
  /** Present when updating an event that already exists. */
  existingEvent?: { id: string; priceMinor: number | null };
};

type ResolveEventPriceResult =
  | { ok: true; priceMinor: number | null }
  | { ok: false; error: string };

/**
 * Decides which price an event may be saved with. The form hides the price
 * field for communities without the paid-ticketing flag, but this is the
 * check that actually enforces it.
 */
export async function resolveEventPrice({
  supabase,
  communityId,
  requestedPriceMinor,
  existingEvent,
}: ResolveEventPriceInput): Promise<ResolveEventPriceResult> {
  if (requestedPriceMinor === null || requestedPriceMinor === undefined) {
    if (
      existingEvent?.priceMinor != null &&
      (await hasOpenOrPaidTicketOrders(existingEvent.id))
    ) {
      return {
        ok: false,
        error:
          "This event already has ticket orders, so it cannot be made free.",
      };
    }
    return { ok: true, priceMinor: null };
  }

  if (
    typeof requestedPriceMinor !== "number" ||
    !isValidTicketPriceMinor(requestedPriceMinor)
  ) {
    return { ok: false, error: "Enter a valid ticket price." };
  }

  // An unchanged price stays editable even if the community's flag was
  // switched off after the event was priced.
  if (existingEvent?.priceMinor === requestedPriceMinor) {
    return { ok: true, priceMinor: requestedPriceMinor };
  }

  if (!(await isPaidTicketingEnabledForCommunity(supabase, communityId))) {
    return {
      ok: false,
      error: "Paid tickets are not enabled for this community.",
    };
  }

  return { ok: true, priceMinor: requestedPriceMinor };
}
