const ALLOWED_SOCIAL_SOURCES = new Set([
  "luhive",
  "twitter",
  "facebook",
  "instagram",
  "linkedin",
]);

export type UTMAttribution = {
  utmSource: string;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

function normalizeOptional(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeUtmSource(value: string | null | undefined): string {
  const normalized = normalizeOptional(value);
  if (!normalized) return "direct";

  if (ALLOWED_SOCIAL_SOURCES.has(normalized)) {
    return normalized;
  }

  return normalized;
}

export function parseUTMFromSearchParams(params: URLSearchParams): UTMAttribution {
  return {
    utmSource: normalizeUtmSource(params.get("utm_source")),
    utmMedium: normalizeOptional(params.get("utm_medium")),
    utmCampaign: normalizeOptional(params.get("utm_campaign")),
    utmContent: normalizeOptional(params.get("utm_content")),
    utmTerm: normalizeOptional(params.get("utm_term")),
  };
}
