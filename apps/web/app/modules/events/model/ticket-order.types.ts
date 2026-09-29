import type { Database } from "~/shared/models/database.types";

type TicketOrderRow = Database["public"]["Tables"]["ticket_orders"]["Row"];

export type TicketOrderStatus = "pending" | "paid" | "refunded";

export type TicketOrder = Pick<
  TicketOrderRow,
  | "id"
  | "community_id"
  | "event_id"
  | "registration_id"
  | "amount_minor"
  | "currency"
  | "payment_url"
  | "partner_reference"
> & { status: TicketOrderStatus };

/** What the event page needs to let a user resume an unpaid registration. */
export type PendingTicketPayment = {
  paymentUrl: string | null;
};

export type PaymentLink = {
  paymentUrl: string;
  paymentId: string;
};
