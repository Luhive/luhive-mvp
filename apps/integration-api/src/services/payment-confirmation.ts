import type { SupabaseClient } from '../lib/supabase';
import {
  checkPaymentCallback,
  type PaymentRejection,
} from '../lib/payment-callback-rules';
import {
  ConfirmTicketOrderResult,
  TicketOrderRow,
  type PaymentCallbackRequest,
} from '../schemas/payments';

const ORDER_COLUMNS =
  'id,registration_id,community_id,amount_minor,currency,status,partner_reference';
const UNIQUE_VIOLATION = '23505';

export type PaymentCallbackOutcome =
  | 'confirmed'
  | 'already_paid'
  | 'invalid_payload'
  | PaymentRejection;

export type PaymentConfirmation =
  | { ok: true; outcome: 'confirmed' | 'already_paid' }
  | { ok: false; outcome: PaymentRejection };

type CallbackAuditEntry = {
  keyId: string;
  registrationId: string | null;
  payload: Record<string, unknown>;
  outcome: PaymentCallbackOutcome;
};

export class PaymentConfirmationService {
  constructor(private db: SupabaseClient) {}

  async confirm(input: {
    keyCommunityId: string;
    body: PaymentCallbackRequest;
  }): Promise<PaymentConfirmation> {
    const { keyCommunityId, body } = input;

    const order = await this.findOrder(body.userId);
    const rejection = checkPaymentCallback(order, keyCommunityId, body);
    if (rejection || !order) {
      return { ok: false, outcome: rejection ?? 'not_found' };
    }

    if (order.partner_reference === null) {
      await this.adoptPartnerReference(order.id, body.checkilaRequestId);
    }

    const { data, error } = await this.db.rpc('confirm_ticket_order', {
      p_registration_id: body.userId,
      p_paid_via: 'partner_callback',
      p_transaction_id: body.transactionId ?? null,
      p_marked_paid_by: null,
    });

    if (error) {
      // The same Epoint transaction id can belong to one order only.
      if (error.code === UNIQUE_VIOLATION) {
        return { ok: false, outcome: 'conflict' };
      }
      throw error;
    }

    const result = ConfirmTicketOrderResult.parse(data);
    if (result === 'confirmed' || result === 'already_paid') {
      return { ok: true, outcome: result };
    }

    return { ok: false, outcome: result };
  }

  // Append-only. A failed audit write must never change the callback's answer.
  async recordCallback(entry: CallbackAuditEntry): Promise<void> {
    const { error } = await this.db.from('payment_callbacks').insert({
      key_id: entry.keyId,
      registration_id: entry.registrationId,
      payload: entry.payload,
      outcome: entry.outcome,
    });

    if (error) {
      console.error('payment_callbacks insert failed', {
        outcome: entry.outcome,
        code: error.code,
      });
    }
  }

  private async findOrder(registrationId: string): Promise<TicketOrderRow | null> {
    const { data, error } = await this.db
      .from('ticket_orders')
      .select(ORDER_COLUMNS)
      .eq('registration_id', registrationId)
      .maybeSingle();

    if (error) throw error;
    return data ? TicketOrderRow.parse(data) : null;
  }

  private async adoptPartnerReference(
    orderId: string,
    partnerReference: string,
  ): Promise<void> {
    const { error } = await this.db
      .from('ticket_orders')
      .update({ partner_reference: partnerReference })
      .eq('id', orderId)
      .eq('status', 'pending')
      .is('partner_reference', null);

    if (error) throw error;
  }
}
