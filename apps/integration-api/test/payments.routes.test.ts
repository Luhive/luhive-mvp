import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateApiKey } from '../src/lib/api-key';
import {
  createFakeDb,
  createFakeDbState,
  type FakeDbState,
} from './helpers/fake-db';

const testDb = vi.hoisted(() => ({ current: null as unknown }));

vi.mock('../src/lib/supabase', () => ({
  createSupabase: () => testDb.current,
}));

import app from '../src/app';

const COMMUNITY_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COMMUNITY_ID = '33333333-3333-4333-8333-333333333333';
const REGISTRATION_ID = '22222222-2222-4222-8222-222222222222';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'x'.repeat(40),
  ENVIRONMENT: 'development' as const,
};

const validBody = {
  userId: REGISTRATION_ID,
  status: 'success',
  amount: 25,
  checkilaRequestId: 'checkila-payment-1',
  transactionId: 'epoint-txn-1',
};

let state: FakeDbState;

function addKey(
  kind: 'community' | 'partner',
  scopes: string[],
  communityId: string | null,
) {
  const key = generateApiKey(kind);
  state.apiKeys.push({
    key_id: key.keyId,
    key_kind: kind,
    community_id: communityId,
    scopes,
    key_hash: key.keyHash,
    revoked_at: null,
    expires_at: null,
  });
  return key.raw;
}

function addPendingOrder(overrides: Partial<FakeDbState['orders'][number]> = {}) {
  state.orders.push({
    id: 'order-1',
    registration_id: REGISTRATION_ID,
    community_id: COMMUNITY_ID,
    amount_minor: 2500,
    currency: 'AZN',
    status: 'pending',
    partner_reference: 'checkila-payment-1',
    ...overrides,
  });
}

function post(body: unknown, headers: Record<string, string>) {
  return app.request(
    '/v1/payments/confirm',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
    env,
  );
}

function confirmWith(rawKey: string, body: unknown = validBody) {
  return post(body, { 'x-api-key': rawKey });
}

beforeEach(() => {
  state = createFakeDbState();
  testDb.current = createFakeDb(state);
});

describe('POST /v1/payments/confirm authentication', () => {
  it('rejects a request without a key', async () => {
    const res = await post(validBody, {});
    expect(res.status).toBe(401);
    expect(state.confirmCalls).toHaveLength(0);
  });

  it('rejects an unknown key', async () => {
    addKey('community', ['payments:confirm'], COMMUNITY_ID);
    const res = await confirmWith('luh_sk_deadbeef_deadbeef');
    expect(res.status).toBe(401);
  });

  it('rejects a partner key', async () => {
    const raw = addKey('partner', ['payments:confirm'], null);
    const res = await confirmWith(raw);
    expect(res.status).toBe(403);
    expect(state.confirmCalls).toHaveLength(0);
  });

  it('rejects a community key without the payments:confirm scope', async () => {
    const raw = addKey('community', ['events:read'], COMMUNITY_ID);
    addPendingOrder();
    const res = await confirmWith(raw);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: 'insufficient_scope' },
    });
    expect(state.confirmCalls).toHaveLength(0);
  });

  it('accepts the key as a Bearer token as well', async () => {
    const raw = addKey('community', ['payments:confirm'], COMMUNITY_ID);
    addPendingOrder();
    const res = await post(validBody, { Authorization: `Bearer ${raw}` });
    expect(res.status).toBe(200);
  });
});

describe('POST /v1/payments/confirm', () => {
  let rawKey: string;

  beforeEach(() => {
    rawKey = addKey('community', ['payments:confirm'], COMMUNITY_ID);
  });

  it('confirms a matching payment and audits it', async () => {
    addPendingOrder();

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { registration_id: REGISTRATION_ID, status: 'paid' },
    });
    expect(state.confirmCalls).toEqual([
      {
        p_registration_id: REGISTRATION_ID,
        p_paid_via: 'partner_callback',
        p_transaction_id: 'epoint-txn-1',
        p_marked_paid_by: null,
      },
    ]);
    expect(state.callbacks).toHaveLength(1);
    expect(state.callbacks[0]).toMatchObject({
      registration_id: REGISTRATION_ID,
      outcome: 'confirmed',
    });
  });

  it('answers 200 again when the same callback is replayed', async () => {
    addPendingOrder({ status: 'paid' });
    state.confirmResult = 'already_paid';

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(200);
    expect(state.callbacks[0]).toMatchObject({ outcome: 'already_paid' });
  });

  it('stores the partner reference when the order had none', async () => {
    addPendingOrder({ partner_reference: null });

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(200);
    expect(state.orders[0].partner_reference).toBe('checkila-payment-1');
  });

  it('accepts a null transaction id', async () => {
    addPendingOrder();

    const res = await confirmWith(rawKey, { ...validBody, transactionId: null });

    expect(res.status).toBe(200);
    expect(state.confirmCalls[0]).toMatchObject({ p_transaction_id: null });
  });

  it('returns 404 for an unknown registration and does not confirm', async () => {
    const res = await confirmWith(rawKey);

    expect(res.status).toBe(404);
    expect(state.confirmCalls).toHaveLength(0);
    expect(state.callbacks[0]).toMatchObject({ outcome: 'not_found' });
  });

  it("returns 403 for another community's order and does not confirm", async () => {
    addPendingOrder({ community_id: OTHER_COMMUNITY_ID });

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(403);
    expect(state.confirmCalls).toHaveLength(0);
    expect(state.callbacks[0]).toMatchObject({ outcome: 'wrong_community' });
  });

  it('returns 422 when the amount differs and leaves the order pending', async () => {
    addPendingOrder();

    const res = await confirmWith(rawKey, { ...validBody, amount: 24.99 });

    expect(res.status).toBe(422);
    expect(state.confirmCalls).toHaveLength(0);
    expect(state.orders[0].status).toBe('pending');
    expect(state.callbacks[0]).toMatchObject({ outcome: 'amount_mismatch' });
  });

  it('returns 422 when the callback is for a different partner payment', async () => {
    addPendingOrder();

    const res = await confirmWith(rawKey, {
      ...validBody,
      checkilaRequestId: 'some-other-payment',
    });

    expect(res.status).toBe(422);
    expect(state.confirmCalls).toHaveLength(0);
    expect(state.callbacks[0]).toMatchObject({ outcome: 'reference_mismatch' });
  });

  it('returns 409 when the order was refunded', async () => {
    addPendingOrder({ status: 'refunded' });
    state.confirmResult = 'conflict';

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(409);
    expect(state.callbacks[0]).toMatchObject({ outcome: 'conflict' });
  });

  it('returns 409 when the transaction id already belongs to another order', async () => {
    addPendingOrder();
    state.confirmError = { code: '23505', message: 'duplicate key' };

    const res = await confirmWith(rawKey);

    expect(res.status).toBe(409);
  });

  it('returns 400 for a body that is not what Checkila sends', async () => {
    addPendingOrder();

    for (const bad of [
      { ...validBody, status: 'failed' },
      { ...validBody, userId: 'not-a-uuid' },
      { ...validBody, amount: -5 },
      { ...validBody, amount: '25' },
      { ...validBody, checkilaRequestId: '' },
      {},
    ]) {
      const res = await confirmWith(rawKey, bad);
      expect(res.status).toBe(400);
    }

    expect(state.confirmCalls).toHaveLength(0);
    expect(state.callbacks.every((c) => c.outcome === 'invalid_payload')).toBe(true);
  });

  it('returns 400 for a body that is not JSON', async () => {
    const res = await app.request(
      '/v1/payments/confirm',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': rawKey },
        body: 'not json',
      },
      env,
    );

    expect(res.status).toBe(400);
  });

  it('does not store fields Checkila is not documented to send', async () => {
    addPendingOrder();

    await confirmWith(rawKey, { ...validBody, cardNumber: '4111111111111111' });

    expect(JSON.stringify(state.callbacks)).not.toContain('4111');
  });
});
