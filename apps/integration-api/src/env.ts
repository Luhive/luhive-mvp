import { z } from 'zod';

export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENVIRONMENT: z.enum(['development', 'production']),
  // Optional until the confirmation email is configured. Absent means the
  // callback still confirms the payment and skips the email.
  WEB_INTERNAL_URL: z.string().url().optional(),
  INTERNAL_API_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function assertEnv(env: Env) {
  EnvSchema.parse(env);
}
