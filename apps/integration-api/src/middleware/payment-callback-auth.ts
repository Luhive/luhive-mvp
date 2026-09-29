import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { ApiError } from '../lib/errors';
import { createSupabase } from '../lib/supabase';
import { verifyApiKey, type ApiKeyContext } from '../lib/api-key';

const PAYMENT_CONFIRM_SCOPE = 'payments:confirm';

export type PaymentCallbackKey = ApiKeyContext & { community_id: string };

function readRawKey(headers: Headers): string {
  // Checkila sends `x-api-key`; Bearer is accepted for parity with the rest of
  // the API.
  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader) return apiKeyHeader;
  return (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
}

// Gates /v1/payments/*: a community key, locked to one community, holding the
// payments:confirm scope. Partner keys are refused on purpose.
export const paymentCallbackAuth = createMiddleware<{
  Bindings: Env;
  Variables: { paymentKey: PaymentCallbackKey };
}>(async (c, next) => {
  const ctx = await verifyApiKey(
    createSupabase(c.env),
    readRawKey(c.req.raw.headers),
  );

  if (!ctx) throw new ApiError(401, 'unauthorized');
  if (ctx.key_kind !== 'community' || ctx.community_id === null) {
    throw new ApiError(403, 'forbidden');
  }
  if (!ctx.scopes.includes(PAYMENT_CONFIRM_SCOPE)) {
    throw new ApiError(403, 'insufficient_scope');
  }

  c.set('paymentKey', { ...ctx, community_id: ctx.community_id });
  await next();
});
