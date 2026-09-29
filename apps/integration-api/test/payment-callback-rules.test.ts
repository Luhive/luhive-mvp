import { describe, it, expect } from 'vitest';
import { checkPaymentCallback } from '../src/lib/payment-callback-rules';
import type {
  PaymentCallbackRequest,
  TicketOrderRow,
} from '../src/schemas/payments';

const COMMUNITY_ID = '11111111-1111-4111-8111-111111111111';
const REGISTRATION_ID = '22222222-2222-4222-8222-222222222222';

const order: TicketOrderRow = {
  id: 'order-1',
  registration_id: REGISTRATION_ID,
  community_id: COMMUNITY_ID,
  amount_minor: 2500,
  currency: 'AZN',
  status: 'pending',
  partner_reference: 'checkila-payment-1',
};

const body: PaymentCallbackRequest = {
  userId: REGISTRATION_ID,
  status: 'success',
  amount: 25,
  checkilaRequestId: 'checkila-payment-1',
  transactionId: 'epoint-txn-1',
};

describe('checkPaymentCallback', () => {
  it('accepts a callback that matches the order', () => {
    expect(checkPaymentCallback(order, COMMUNITY_ID, body)).toBeNull();
  });

  it('accepts a replay for an order that is already paid', () => {
    expect(
      checkPaymentCallback({ ...order, status: 'paid' }, COMMUNITY_ID, body),
    ).toBeNull();
  });

  it('rejects an unknown order', () => {
    expect(checkPaymentCallback(null, COMMUNITY_ID, body)).toBe('not_found');
  });

  it("rejects another community's order", () => {
    expect(
      checkPaymentCallback(
        order,
        '33333333-3333-4333-8333-333333333333',
        body,
      ),
    ).toBe('wrong_community');
  });

  it('rejects a different amount in either direction', () => {
    expect(checkPaymentCallback(order, COMMUNITY_ID, { ...body, amount: 24.99 })).toBe('amount_mismatch');
    expect(checkPaymentCallback(order, COMMUNITY_ID, { ...body, amount: 25.01 })).toBe('amount_mismatch');
  });

  it('rejects an amount that is not exact minor units', () => {
    expect(checkPaymentCallback(order, COMMUNITY_ID, { ...body, amount: 25.005 })).toBe('amount_mismatch');
  });

  it('accepts amounts with float noise that are exactly the order amount', () => {
    const cents = { ...order, amount_minor: 30 };
    expect(
      checkPaymentCallback(cents, COMMUNITY_ID, { ...body, amount: 0.1 + 0.2 }),
    ).toBeNull();
  });

  it('rejects an order that is not in AZN', () => {
    expect(
      checkPaymentCallback({ ...order, currency: 'USD' }, COMMUNITY_ID, body),
    ).toBe('amount_mismatch');
  });

  it('rejects a callback for a different partner payment', () => {
    expect(
      checkPaymentCallback(order, COMMUNITY_ID, {
        ...body,
        checkilaRequestId: 'some-other-payment',
      }),
    ).toBe('reference_mismatch');
  });

  it('accepts any reference when the order has none stored yet', () => {
    expect(
      checkPaymentCallback(
        { ...order, partner_reference: null },
        COMMUNITY_ID,
        body,
      ),
    ).toBeNull();
  });
});
