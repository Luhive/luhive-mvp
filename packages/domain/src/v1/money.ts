export const MINOR_UNITS_PER_MAJOR_UNIT = 100;

// 100,000 AZN. A pilot guard against typos, not a business rule.
export const MAX_TICKET_PRICE_MINOR = 10_000_000;

export function isValidTicketPriceMinor(minor: number): boolean {
  return (
    Number.isInteger(minor) && minor > 0 && minor <= MAX_TICKET_PRICE_MINOR
  );
}

// Returns null when the amount is not a finite non-negative number with at
// most two decimals, so callers can tell "wrong amount" from "zero".
export function majorToMinorUnits(major: number): number | null {
  if (!Number.isFinite(major) || major < 0) return null;

  const minor = Math.round(major * MINOR_UNITS_PER_MAJOR_UNIT);
  const roundTripMajor = minor / MINOR_UNITS_PER_MAJOR_UNIT;
  if (Math.abs(roundTripMajor - major) > 1e-9) return null;

  return minor;
}

export function minorToMajorUnits(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR_UNIT;
}

// Accepts what people type: "12", "12.5", "12,50", " 12.50 ". Returns null for
// anything else, including more than two decimals, so the form can reject it.
export function parsePriceInputToMinor(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  return majorToMinorUnits(Number(normalized));
}

export function formatMoney(
  minor: number,
  currency: string,
  locale = "az-AZ",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(minorToMajorUnits(minor));
}
