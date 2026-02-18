import { useOutletContext, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { EventsContent } from "~/modules/events/components/events-content";
import type { Database } from "~/shared/models/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];

interface OutletContext {
  community: Community | null;
  loading: boolean;
  slug: string;
  onEventClick?: (event: Event) => void;
}

export function meta({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  return [
    { title: `Events - ${slug.toLocaleUpperCase()} Community | Build Communities that Matter` },
    { name: "description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
    { name: "keywords", content: `${slug} events, community events, meetups, workshops, networking, activities, ${slug} community` },
    { property: "og:title", content: `Events - ${slug} Community` },
    { property: "og:description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Community Platform" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `Events - ${slug} Community` },
    { name: "twitter:description", content: `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.` },
    { name: "robots", content: "index, follow" },
    { name: "author", content: `${slug} Community` },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `Events - ${slug} Community`,
        "description": `Discover upcoming events and activities in the ${slug} community. Join engaging meetups, workshops, and networking opportunities.`,
        "url": `https://luhive.com/c/${slug}/events`,
        "isPartOf": { "@type": "WebSite", "name": "Community Platform", "url": "https://luhive.com" },
        "about": { "@type": "Organization", "name": `${slug} Community`, "description": `Community events and activities for ${slug}` },
      },
    },
  ];
}

export default function EventsIndex() {
  const { community, loading, slug, onEventClick } = useOutletContext<OutletContext>();
  const location = useLocation();
  const hasRestoredScrollRef = useRef(false);
  const savedScrollRef = useRef<number | null>(null);

  const navigationState = location.state as { events?: Event[] } | null;
  const initialEvents = navigationState?.events || [];

  useEffect(() => {
    const handleScrollSave = ((event: CustomEvent<number>) => {
      savedScrollRef.current = event.detail;
    }) as EventListener;
    window.addEventListener("saveOverlayScroll", handleScrollSave);
    return () => window.removeEventListener("saveOverlayScroll", handleScrollSave);
  }, []);

  useEffect(() => {
    if (initialEvents.length > 0 && !hasRestoredScrollRef.current) {
      if (savedScrollRef.current !== null) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, savedScrollRef.current!);
            hasRestoredScrollRef.current = true;
            savedScrollRef.current = null;
          });
        });
      } else {
        hasRestoredScrollRef.current = true;
      }
    }
  }, [initialEvents.length]);

  return (
    <EventsContent
      community={community}
      loading={loading}
      slug={slug}
      initialEvents={initialEvents}
      onEventClick={onEventClick}
    />
  );
}
