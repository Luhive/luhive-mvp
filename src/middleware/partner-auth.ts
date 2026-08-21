import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { ApiError } from '../lib/errors';
import { createSupabase } from '../lib/supabase';
import { verifyApiKey, type ApiKeyContext } from '../lib/api-key';

const PARTNER_SCOPE = 'public_events:read';

// Gates /v1/public/*: partner keys only. Never reads community_id.
export const partnerAuth = createMiddleware<{
  Bindings: Env;
  Variables: { partner: ApiKeyContext };
}>(async (c, next) => {
  const raw = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const ctx = await verifyApiKey(createSupabase(c.env), raw);

  if (!ctx) throw new ApiError(401, 'unauthorized');
  if (ctx.key_kind !== 'partner') throw new ApiError(403, 'forbidden');
  if (!ctx.scopes.includes(PARTNER_SCOPE)) {
    throw new ApiError(403, 'insufficient_scope');
  }

  c.set('partner', ctx);
  await next();
});
