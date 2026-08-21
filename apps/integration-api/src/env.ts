import { z } from 'zod';

export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENVIRONMENT: z.enum(['development', 'production']),
});

export type Env = z.infer<typeof EnvSchema>;

export function assertEnv(env: Env) {
  EnvSchema.parse(env);
}
