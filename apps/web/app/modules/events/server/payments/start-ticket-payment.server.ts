import type { Event } from "~/shared/models/entity.types";
import type { TicketOrder } from "~/modules/events/model/ticket-order.types";
import {
  createPendingTicketOrder,
  saveTicketOrderPaymentLink,
} from "~/modules/events/data/ticket-orders-repo.server";
import { createCheckilaPayment } from "~/modules/events/server/payments/checkila-client.server";

type StartTicketPaymentInput = {
  event: Event;
  registrationId: string;
  /** Present when the registration already has an order (a retry). */
  existingOrder?: TicketOrder | null;
  /** The event page the partner sends the user back to after paying. */
  eventReturnUrl?: string;
};

type StartTicketPaymentResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; error: string };

/**
 * Makes sure a pending registration has an order with a payment link and
 * returns that link. Safe to call repeatedly: an order that already has a link
 * is reused, so one registration never owns two partner payments.
 */
export async function startTicketPayment({
  event,
  registrationId,
  existingOrder,
  eventReturnUrl,
}: StartTicketPaymentInput): Promise<StartTicketPaymentResult> {
  if (existingOrder?.payment_url) {
    return { ok: true, paymentUrl: existingOrder.payment_url };
  }

  if (event.price_minor === null || event.price_minor <= 0) {
    return { ok: false, error: "This event is not a paid event." };
  }

  const order =
    existingOrder ??
    (await createPendingTicketOrder({
      communityId: event.community_id,
      eventId: event.id,
      registrationId,
      amountMinor: event.price_minor,
      currency: event.currency,
    }));

  const payment = await createCheckilaPayment({
    registrationId,
    amountMinor: order.amount_minor,
    description: event.title,
    redirectUrl: eventReturnUrl,
  });

  if (!payment.ok) {
    return { ok: false, error: "Could not start payment. Please try again." };
  }

  try {
    await saveTicketOrderPaymentLink(order.id, {
      paymentUrl: payment.link.paymentUrl,
      partnerReference: payment.link.paymentId,
    });
  } catch (error) {
    // The payment exists at the partner already, so the user still gets the
    // link. The callback accepts an order without a stored reference.
    console.error("Failed to store payment link", {
      registrationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  return { ok: true, paymentUrl: payment.link.paymentUrl };
}
