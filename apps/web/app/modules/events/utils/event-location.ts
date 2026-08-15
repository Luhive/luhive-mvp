import type { LocationValue } from '~/modules/events/model/event-location.types';

/**
 * Derives a short locality string from a full formatted address.
 * Splits on commas and picks the second-to-last part (typically the city/district
 * before the country), stripping postal codes and extra whitespace.
 *
 * "55 Xocali prospekti, Baki 1142, Azerbaijan" → "Baki"
 * "Times Square, New York, NY, USA" → "NY"
 */
export function deriveLocality(address: string | null | undefined): string {
  const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return '';
  const candidate = parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
  return candidate.replace(/\d{3,}/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Converts a raw events row to a LocationValue.
 * Returns null when the event was created before structured location data
 * (i.e. missing place_id or coordinates) so callers can render a legacy fallback.
 */
export function toLocationValue(event: {
  location_place_id?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
}): LocationValue | null {
  if (!event.location_place_id || event.location_lat == null || event.location_lng == null) {
    return null;
  }
  return {
    placeId: event.location_place_id,
    name: event.location_name ?? '',
    address: event.location_address ?? '',
    lat: event.location_lat,
    lng: event.location_lng,
  };
}
