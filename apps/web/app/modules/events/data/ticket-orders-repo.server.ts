import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { EventListRevenueRow } from "~/modules/events/model/event-revenue.types";
import type {
  TicketOrder,
  TicketOrderStatus,
} from "~/modules/events/model/ticket-order.types";

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

export async function getEventTicketRevenue(eventId: string): Promise<{
  revenueMinor: number;
  paidCount: number;
  pendingCount: number;
  currency: string | null;
}> {
  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select("amount_minor, currency, status")
    .eq("event_id", eventId);

  if (error) {
    throw new Error(`Failed to read ticket revenue: ${error.message}`);
  }

  let revenueMinor = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let currency: string | null = null;

  for (const order of data ?? []) {
    currency ??= order.currency;
    if (order.status === "paid") {
      revenueMinor += order.amount_minor;
      paidCount += 1;
    } else if (order.status === "pending") {
      pendingCount += 1;
    }
  }

  return { revenueMinor, paidCount, pendingCount, currency };
}

export async function getCommunityPaidRevenue(
  communityId: string,
): Promise<{ revenueMinor: number; currency: string | null }> {
  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select("amount_minor, currency")
    .eq("community_id", communityId)
    .eq("status", "paid");

  if (error) {
    throw new Error(`Failed to read ticket revenue: ${error.message}`);
  }

  let revenueMinor = 0;
  let currency: string | null = null;
  for (const order of data ?? []) {
    currency ??= order.currency;
    revenueMinor += order.amount_minor;
  }

  return { revenueMinor, currency };
}

export async function listCommunityTicketRevenue(
  communityId: string,
  eventIds: string[],
): Promise<{ currency: string | null; byEventId: Record<string, EventListRevenueRow> }> {
  if (eventIds.length === 0) {
    return { currency: null, byEventId: {} };
  }

  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select("event_id, amount_minor, currency, status")
    .eq("community_id", communityId)
    .in("event_id", eventIds);

  if (error) {
    throw new Error(`Failed to read ticket revenue: ${error.message}`);
  }

  const byEventId: Record<string, EventListRevenueRow> = {};
  let currency: string | null = null;

  for (const order of data ?? []) {
    currency ??= order.currency;
    const row = byEventId[order.event_id] ?? { revenueMinor: 0, paidCount: 0 };
    if (order.status === "paid") {
      row.revenueMinor += order.amount_minor;
      row.paidCount += 1;
    }
    byEventId[order.event_id] = row;
  }

  return { currency, byEventId };
}

export async function listTicketOrderStatusesForEvent(
  eventId: string,
): Promise<{ registrationId: string; status: TicketOrderStatus }[]> {
  const { data, error } = await createServiceRoleClient()
    .from("ticket_orders")
    .select("registration_id, status")
    .eq("event_id", eventId);

  if (error) {
    throw new Error(`Failed to read ticket orders: ${error.message}`);
  }

  return (data ?? []).map((order) => ({
    registrationId: order.registration_id,
    status: order.status as TicketOrderStatus,
  }));
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
