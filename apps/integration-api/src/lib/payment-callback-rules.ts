import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { majorToMinorUnits } from '@luhive/domain/v1/money';
import type { PaymentCallbackRequest, TicketOrderRow } from '../schemas/payments';

export type PaymentRejection =
  | 'not_found'
  | 'wrong_community'
  | 'amount_mismatch'
  | 'reference_mismatch'
  | 'conflict';

// Checkila retries on any non-2xx, so permanent rejections are 4xx and only a
// genuine server fault is allowed to become a 5xx.
export const PAYMENT_REJECTION_STATUS: Record<
  PaymentRejection,
  ContentfulStatusCode
> = {
  not_found: 404,
  wrong_community: 403,
  amount_mismatch: 422,
  reference_mismatch: 422,
  conflict: 409,
};

const ORDER_CURRENCY = 'AZN';

// Decides whether a callback may touch this order. Pure: no database, no I/O.
// Replays of an already-paid order pass these checks on purpose; the confirm
// step is what makes them idempotent.
export function checkPaymentCallback(
  order: TicketOrderRow | null,
  keyCommunityId: string,
  body: PaymentCallbackRequest,
): PaymentRejection | null {
  if (!order) return 'not_found';

  if (order.community_id !== keyCommunityId) return 'wrong_community';

  const paidMinor = majorToMinorUnits(body.amount);
  if (
    order.currency !== ORDER_CURRENCY ||
    paidMinor === null ||
    paidMinor !== order.amount_minor
  ) {
    return 'amount_mismatch';
  }

  // An order without a stored reference is accepted: link creation may have
  // failed to save it even though the partner created the payment.
  if (
    order.partner_reference !== null &&
    order.partner_reference !== body.checkilaRequestId
  ) {
    return 'reference_mismatch';
  }

  return null;
}
