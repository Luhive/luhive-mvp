import { createServiceRoleClient } from "~/shared/lib/supabase/server";

export type ConfirmTicketOrderOutcome =
  | "confirmed"
  | "already_paid"
  | "not_found"
  | "conflict";

/** The same confirm rule the partner callback uses. Manual payments pass no transaction id. */
export async function confirmTicketOrder(input: {
  registrationId: string;
  paidVia: "manual";
  markedPaidBy: string;
}): Promise<ConfirmTicketOrderOutcome> {
  const { data, error } = await createServiceRoleClient().rpc(
    "confirm_ticket_order",
    {
      p_registration_id: input.registrationId,
      p_paid_via: input.paidVia,
      p_transaction_id: null as unknown as string,
      p_marked_paid_by: input.markedPaidBy,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (
    data === "confirmed" ||
    data === "already_paid" ||
    data === "not_found" ||
    data === "conflict"
  ) {
    return data;
  }

  throw new Error("Unexpected confirm result");
}
