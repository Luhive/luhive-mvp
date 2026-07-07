import { createHmac, timingSafeEqual } from "node:crypto";

function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET environment variable is not set");
  }
  return secret;
}

function signPayload(communityId: string, userId: string): string {
  return createHmac("sha256", getUnsubscribeSecret())
    .update(`${communityId}:${userId}`)
    .digest("hex");
}

export function verifyUnsubscribeSig(
  communityId: string,
  userId: string,
  sig: string,
): boolean {
  if (!communityId || !userId || !sig) {
    return false;
  }

  const expected = signPayload(communityId, userId);
  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const sigBuffer = Buffer.from(sig, "hex");
    if (expectedBuffer.length !== sigBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, sigBuffer);
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(
  origin: string,
  communityId: string,
  userId: string,
): string {
  const sig = signPayload(communityId, userId);
  const params = new URLSearchParams({
    c: communityId,
    u: userId,
    sig,
  });
  return `${origin.replace(/\/$/, "")}/unsubscribe?${params.toString()}`;
}

export function buildUnsubscribeListHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export function getEmailOrigin(): string {
  return (process.env.APP_URL || "https://luhive.com").replace(/\/$/, "");
}

export function buildUnsubscribeFooterHtml(
  unsubscribeUrl: string,
  communityName: string,
): string {
  return `
    <p style="color: #9B9B9B; font-size: 12px; margin-top: 24px; text-align: center;">
      You are receiving this because you are a member of ${communityName}.
      <a href="${unsubscribeUrl}" style="color: #9B9B9B;">Unsubscribe from emails</a>
    </p>
  `;
}
