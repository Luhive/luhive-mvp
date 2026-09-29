import { minorToMajorUnits } from "@luhive/domain/v1/money";
import type { PaymentLink } from "~/modules/events/model/ticket-order.types";

const DEFAULT_CHECKILA_PAYMENTS_URL =
  "https://back.checkila.com/integrations/luhive/payments";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_DESCRIPTION_LENGTH = 255;

type CreateCheckilaPaymentInput = {
  /** Sent as Checkila's `userId`; the callback echoes it back unchanged. */
  registrationId: string;
  amountMinor: number;
  description: string;
};

type CreateCheckilaPaymentResult =
  | { ok: true; link: PaymentLink }
  | { ok: false; error: string };

function createFakePaymentLink(registrationId: string): PaymentLink {
  const paymentId = crypto.randomUUID();
  return {
    paymentId,
    paymentUrl: `https://checkila.example/fake-pay/${paymentId}?registration=${registrationId}`,
  };
}

function parsePaymentLink(body: unknown): PaymentLink | null {
  if (typeof body !== "object" || body === null) return null;

  const { paymentId, paymentUrl } = body as Record<string, unknown>;
  if (typeof paymentId !== "string" || !paymentId) return null;
  if (typeof paymentUrl !== "string") return null;

  try {
    const url = new URL(paymentUrl);
    if (url.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { paymentId, paymentUrl };
}

/**
 * Asks the partner (Checkila) to create an Epoint payment and return the link
 * the user pays through. Never logs the link or the API key.
 */
export async function createCheckilaPayment(
  input: CreateCheckilaPaymentInput,
): Promise<CreateCheckilaPaymentResult> {
  if (process.env.CHECKILA_FAKE === "true") {
    return { ok: true, link: createFakePaymentLink(input.registrationId) };
  }

  const apiKey = process.env.CHECKILA_API_KEY;
  if (!apiKey) {
    console.error("CHECKILA_API_KEY is not set");
    return { ok: false, error: "Payments are not configured." };
  }

  try {
    const response = await fetch(
      process.env.CHECKILA_API_URL || DEFAULT_CHECKILA_PAYMENTS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          userId: input.registrationId,
          amount: minorToMajorUnits(input.amountMinor),
          description: input.description.slice(0, MAX_DESCRIPTION_LENGTH),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      console.error("Checkila rejected payment creation", {
        status: response.status,
        registrationId: input.registrationId,
      });
      return { ok: false, error: "Could not start payment." };
    }

    const link = parsePaymentLink(await response.json());
    if (!link) {
      console.error("Checkila returned an unexpected payment response", {
        registrationId: input.registrationId,
      });
      return { ok: false, error: "Could not start payment." };
    }

    return { ok: true, link };
  } catch (error) {
    console.error("Checkila payment request failed", {
      registrationId: input.registrationId,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return { ok: false, error: "Could not start payment." };
  }
}
