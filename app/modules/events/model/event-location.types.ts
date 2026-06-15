/** Structured location data resolved from Google Places. */
export interface LocationValue {
  /** Venue display name, e.g. "United Coffee Beans" */
  name: string;
  /** Formatted address from Google Places, e.g. "5 Neftchilar Ave, Baku 1000" */
  address: string;
  lat: number;
  lng: number;
  /** Google Places place_id — used to generate Maps/embed/directions URLs on the fly */
  placeId: string;
}
