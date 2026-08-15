import type { LoaderFunctionArgs } from "react-router";
import { generateEventOgImage } from "~/modules/events/server/event-og-image.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { slug, eventSlug } = params as { slug?: string; eventSlug?: string };
  return generateEventOgImage(request, slug, eventSlug);
}
