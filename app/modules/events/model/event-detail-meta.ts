import dayjs from "dayjs";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";

export function meta({ data }: { data?: EventDetailLoaderData }) {
  if (!data) {
    return [
      { title: "Event Not Found" },
      { name: "description", content: "Event not found" },
    ];
  }

  const { event, community, origin } = data;
  const eventDate = dayjs(event.start_time).format("MMMM D, YYYY");

  const canonicalUrl = Routes.absolute(origin, Routes.community.event(community.slug, publicEventSlug(event)));

  // Custom branded OG image, generated on-demand. Immutable-cached, so append a
  // version derived from the event's last update to bust the cache on changes.
  const ogVersion = event.updated_at
    ? new Date(event.updated_at).getTime()
    : null;
  const imageUrl = `${Routes.absolute(
    origin,
    Routes.og.event(community.slug, publicEventSlug(event)),
  )}${ogVersion ? `?v=${ogVersion}` : ""}`;

  const communityName = community?.name ?? "Community";

  const metaTags: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
    | { tagName: string; rel: string; href: string }
  > = [
    { title: `${event.title} - ${communityName}` },
    {
      name: "description",
      content:
        event.description ||
        `Join ${event.title} hosted by ${communityName} on ${eventDate}`,
    },
    { property: "og:title", content: `${event.title} - ${communityName}` },
    {
      property: "og:description",
      content: event.description || `Join ${event.title}`,
    },
    { property: "og:type", content: "event" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: "Luhive" },
  ];

  if (imageUrl) {
    metaTags.push(
      { property: "og:image", content: imageUrl },
      { property: "og:image:secure_url", content: imageUrl },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${event.title} - ${communityName}` }
    );
  }

  metaTags.push(
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${event.title} - ${communityName}` },
    {
      name: "twitter:description",
      content: event.description || `Join ${event.title}`,
    }
  );

  if (imageUrl) {
    metaTags.push({ name: "twitter:image", content: imageUrl });
  }

  metaTags.push({ tagName: "link", rel: "canonical", href: canonicalUrl });

  return metaTags;
}
