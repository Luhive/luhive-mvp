import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { assertEnv, type Env } from './env';
import { createSupabase } from './lib/supabase';
import { verifyApiKey } from './lib/api-key';
import { ApiError } from './lib/errors';
import { fail, successBody } from './lib/response';
import publicRoutes from './routes/public';

const app = new Hono<{ Bindings: Env }>();

// Ops liveness probe: intentionally outside the /v1 envelope.
app.get('/health', (c) => c.json({ status: 'ok' }));

app.use('/v1/*', async (c, next) => {
  assertEnv(c.env);
  await next();
});

app.get('/v1/whoami', async (c) => {
  const auth = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const ctx = await verifyApiKey(createSupabase(c.env), auth);
  if (!ctx) return fail(c, 401, 'unauthorized');
  return c.json(successBody(ctx));
});

app.route('/v1/public', publicRoutes);

app.notFound((c) => fail(c, 404, 'not_found'));
app.onError((err, c) => {
  if (err instanceof ApiError) {
    return fail(c, err.status as ContentfulStatusCode, err.code);
  }
  console.error(err);
  return fail(c, 500, 'internal_error');
});

export default app;
