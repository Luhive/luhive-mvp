import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";

type EventForReturnUrl = Parameters<typeof publicEventSlug>[0];

/**
 * The event page a partner sends someone back to after they have paid.
 * `registered=1` makes the page highlight the registration card.
 */
export function buildEventReturnUrl(
  origin: string,
  communitySlug: string,
  event: EventForReturnUrl,
): string {
  const url = new URL(
    Routes.absolute(
      origin,
      Routes.community.event(communitySlug, publicEventSlug(event)),
    ),
  );
  url.searchParams.set("registered", "1");
  return url.toString();
}
