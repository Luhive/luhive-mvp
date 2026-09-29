// The per-community switch lives in communities.settings.features.paid_ticketing.
// Anything other than a literal `true` counts as off, so a missing or malformed
// settings blob can never enable paid tickets.
export function isPaidTicketingEnabled(settings: unknown): boolean {
  if (!isRecord(settings)) return false;

  const features = settings.features;
  if (!isRecord(features)) return false;

  return features.paid_ticketing === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
