import { Hono } from 'hono';
import type { Env } from '../env';
import {
  paymentCallbackAuth,
  type PaymentCallbackKey,
} from '../middleware/payment-callback-auth';
import { PaymentCallbackRequest } from '../schemas/payments';
import { PaymentConfirmationService } from '../services/payment-confirmation';
import { PAYMENT_REJECTION_STATUS } from '../lib/payment-callback-rules';
import { createSupabase } from '../lib/supabase';
import { fail, successBody } from '../lib/response';

const paymentRoutes = new Hono<{
  Bindings: Env;
  Variables: { paymentKey: PaymentCallbackKey };
}>();

paymentRoutes.use('*', paymentCallbackAuth);

// Only fields Checkila is documented to send; never store unknown extras.
function pickAuditPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) return {};
  const source = raw as Record<string, unknown>;
  return {
    userId: source.userId,
    status: source.status,
    amount: source.amount,
    checkilaRequestId: source.checkilaRequestId,
    transactionId: source.transactionId,
  };
}

paymentRoutes.post('/confirm', async (c) => {
  const key = c.get('paymentKey');
  const service = new PaymentConfirmationService(createSupabase(c.env));

  const rawBody = await c.req.json().catch(() => null);
  const parsed = PaymentCallbackRequest.safeParse(rawBody);

  if (!parsed.success) {
    await service.recordCallback({
      keyId: key.key_id,
      registrationId: null,
      payload: pickAuditPayload(rawBody),
      outcome: 'invalid_payload',
    });
    return fail(
      c,
      400,
      'invalid_payload',
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  const body = parsed.data;
  const result = await service.confirm({
    keyCommunityId: key.community_id,
    body,
  });

  await service.recordCallback({
    keyId: key.key_id,
    registrationId: body.userId,
    payload: pickAuditPayload(body),
    outcome: result.outcome,
  });

  if (!result.ok) {
    return fail(c, PAYMENT_REJECTION_STATUS[result.outcome], result.outcome);
  }

  return c.json(successBody({ registration_id: body.userId, status: 'paid' }));
});

export default paymentRoutes;
