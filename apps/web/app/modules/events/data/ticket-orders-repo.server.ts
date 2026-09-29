import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { TicketOrder } from "~/modules/events/model/ticket-order.types";

/**
 * ticket_orders is closed to anon/authenticated roles, so every read and write
 * goes through the service-role client. Callers must have authorised the
 * request before calling into this file.
 */

const TICKET_ORDER_COLUMNS =
  "id, community_id, event_id, registration_id, amount_minor, currency, status, payment_url, partner_reference";

export async function hasOpenOrPaidTicketOrders(
  eventId: string,
): Promise<boolean> {
  const { count, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ["pending", "paid"]);

  if (error) {
    throw new Error(`Failed to read ticket orders: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function findTicketOrderByRegistrationId(
  registrationId: string,
): Promise<TicketOrder | null> {
  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select(TICKET_ORDER_COLUMNS)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read ticket order: ${error.message}`);
  }

  return (data as TicketOrder | null) ?? null;
}

export async function createPendingTicketOrder(input: {
  communityId: string;
  eventId: string;
  registrationId: string;
  amountMinor: number;
  currency: string;
}): Promise<TicketOrder> {
  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .insert({
      community_id: input.communityId,
      event_id: input.eventId,
      registration_id: input.registrationId,
      amount_minor: input.amountMinor,
      currency: input.currency,
    })
    .select(TICKET_ORDER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create ticket order: ${error?.message ?? "no row returned"}`,
    );
  }

  return data as TicketOrder;
}

export async function saveTicketOrderPaymentLink(
  orderId: string,
  link: { paymentUrl: string; partnerReference: string },
): Promise<void> {
  const { error } = await createServiceRoleClient()
    .from("ticket_orders")
    .update({
      payment_url: link.paymentUrl,
      partner_reference: link.partnerReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to save payment link: ${error.message}`);
  }
}

export async function deletePendingTicketOrder(
  registrationId: string,
): Promise<void> {
  const { error } = await createServiceRoleClient()
    .from("ticket_orders")
    .delete()
    .eq("registration_id", registrationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to delete pending ticket order: ${error.message}`);
  }
}
