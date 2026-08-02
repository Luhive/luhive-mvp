import { useRouteLoaderData } from "react-router";

import { buildCalBookingUrl } from "~/shared/lib/utils/url";

/**
 * Cal.com booking URL with optional first-touch `source` from the root loader.
 */
export function useCalBookingUrl(): string {
  const data = useRouteLoaderData("root") as
    | { firstTouchSource: string | null }
    | undefined;
  return buildCalBookingUrl(data?.firstTouchSource ?? null);
}
