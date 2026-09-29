import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import {
  findTicketOrderByRegistrationId,
  listTicketOrderStatusesForEvent,
} from "~/modules/events/data/ticket-orders-repo.server";
import { confirmTicketOrder } from "~/modules/events/server/payments/confirm-ticket-order.server";
import { sendPaidRegistrationConfirmation } from "~/modules/events/server/payments/send-paid-registration-confirmation.server";

type ManagerResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/** Same authorisation as the existing registration status update. */
async function requireEventManager(
  request: Request,
  eventId: string,
): Promise<ManagerResult> {
  const { supabase } = createClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("community_id")
    .eq("id", eventId)
    .single();
  if (eventError || !event) {
    return { ok: false, error: "Event not found" };
  }

  const { data: collaboration } = await supabase
    .from("event_collaborations")
    .select("role")
    .eq("event_id", eventId)
    .eq("community_id", event.community_id)
    .in("role", ["host", "co-host"])
    .eq("status", "accepted")
    .single();
  if (!collaboration) {
    return { ok: false, error: "You do not have permission to manage this event" };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", event.community_id)
    .eq("user_id", user.id)
    .single();
  if (membershipError || !membership || !["owner", "admin"].includes(membership.role || "")) {
    const { data: community } = await supabase
      .from("communities")
      .select("created_by")
      .eq("id", event.community_id)
      .single();
    if (!community || community.created_by !== user.id) {
      return { ok: false, error: "You do not have permission to manage this event" };
    }
  }

  return { ok: true, userId: user.id };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) {
    return Response.json({ error: "Missing eventId" }, { status: 400 });
  }

  const manager = await requireEventManager(request, eventId);
  if (!manager.ok) {
    const status = manager.error === "Unauthorized" ? 401 : 403;
    return Response.json({ error: manager.error }, { status });
  }

  const orders = await listTicketOrderStatusesForEvent(eventId);
  return Response.json({ orders });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const registrationId = formData.get("registrationId");
  const eventId = formData.get("eventId");
  const intent = formData.get("intent");

  if (
    typeof registrationId !== "string" ||
    typeof eventId !== "string" ||
    (intent !== "mark-paid" && intent !== "resend")
  ) {
    return { success: false, error: "Missing required fields" };
  }

  const manager = await requireEventManager(request, eventId);
  if (!manager.ok) {
    return { success: false, error: manager.error };
  }

  const order = await findTicketOrderByRegistrationId(registrationId);
  if (!order || order.event_id !== eventId) {
    return { success: false, error: "Ticket order not found" };
  }

  const origin = new URL(request.url).origin;

  if (intent === "resend") {
    if (order.status !== "paid") {
      return { success: false, error: "This ticket has not been paid" };
    }
    const result = await sendPaidRegistrationConfirmation(registrationId, origin, {
      resend: true,
    });
    if (!result.sent) {
      return { success: false, error: "Could not send the confirmation email" };
    }
    return { success: true, message: "Confirmation sent" };
  }

  if (order.status === "refunded") {
    return { success: false, error: "This ticket cannot be marked as paid" };
  }

  const outcome = await confirmTicketOrder({
    registrationId,
    paidVia: "manual",
    markedPaidBy: manager.userId,
  });
  if (outcome === "not_found" || outcome === "conflict") {
    return { success: false, error: "This ticket cannot be marked as paid" };
  }

  try {
    await sendPaidRegistrationConfirmation(registrationId, origin);
  } catch (error) {
    console.error("Marked a ticket paid, but the confirmation email failed:", error);
    return {
      success: true,
      message: "Marked as paid, but the confirmation email failed",
    };
  }

  return { success: true, message: "Marked as paid" };
}
