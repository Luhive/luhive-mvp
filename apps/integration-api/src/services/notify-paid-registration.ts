import type { Env } from '../env';

const TIMEOUT_MS = 5000;

/**
 * Asks the web app to send the confirmation emails. A failure here must never
 * fail the payment callback: the payment is already confirmed.
 */
export async function notifyPaidRegistration(
  env: Env,
  registrationId: string,
): Promise<void> {
  if (!env.WEB_INTERNAL_URL || !env.INTERNAL_API_SECRET) {
    console.error('Paid confirmation email is not configured');
    return;
  }

  try {
    const response = await fetch(
      `${env.WEB_INTERNAL_URL.replace(/\/$/, '')}/api/internal/paid-registration-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': env.INTERNAL_API_SECRET,
        },
        body: JSON.stringify({ registration_id: registrationId }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      console.error('Paid confirmation email request failed', {
        status: response.status,
        registrationId,
      });
    }
  } catch (error) {
    console.error('Paid confirmation email request failed', {
      registrationId,
      reason: error instanceof Error ? error.name : 'unknown',
    });
  }
}
