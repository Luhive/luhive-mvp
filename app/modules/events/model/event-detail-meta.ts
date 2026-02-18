import dayjs from "dayjs";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";

export function meta({ data }: { data?: EventDetailLoaderData }) {
  if (!data) {
    return [
      { title: "Event Not Found" },
      { name: "description", content: "Event not found" },
    ];
  }

  const { event, community, origin } = data;
  const eventDate = dayjs(event.start_time).format("MMMM D, YYYY");

  const canonicalUrl = `${origin}/c/${community.slug}/events/${event.id}`;

  const getAbsoluteImageUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${origin}${url}`;
    }
    return url;
  };

  let imageUrl = getAbsoluteImageUrl(event.cover_url || community.logo_url);

  if (!imageUrl) {
    imageUrl = "https://luhive.com/LuhiveLogoBackground.png";
  }

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      url.search = "";
      imageUrl = url.toString();

      if (
        imageUrl.includes("supabase.co") &&
        !imageUrl.startsWith("https://")
      ) {
        imageUrl = imageUrl.replace(/^http:\/\//, "https://");
      }
    } catch (e) {
      console.warn("Failed to parse image URL:", imageUrl);
    }
  }

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
    const getImageType = (url: string): string => {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes(".png")) return "image/png";
      if (lowerUrl.includes(".jpg") || lowerUrl.includes(".jpeg"))
        return "image/jpeg";
      if (lowerUrl.includes(".webp")) return "image/webp";
      return "image/jpeg";
    };

    const imageType = getImageType(imageUrl);

    metaTags.push(
      { property: "og:image", content: imageUrl },
      { property: "og:image:secure_url", content: imageUrl },
      { property: "og:image:type", content: imageType },
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
