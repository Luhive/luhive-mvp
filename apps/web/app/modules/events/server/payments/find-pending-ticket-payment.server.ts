import { findTicketOrderByRegistrationId } from "~/modules/events/data/ticket-orders-repo.server";
import type { PendingTicketPayment } from "~/modules/events/model/ticket-order.types";

export async function findPendingTicketPayment(
  registrationId: string,
): Promise<PendingTicketPayment | null> {
  const order = await findTicketOrderByRegistrationId(registrationId);
  if (order?.status !== "pending") return null;

  return { paymentUrl: order.payment_url };
}
