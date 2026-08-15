import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";

interface MetaMatch {
  id: string;
  data?: unknown;
}

export function meta({ matches }: { matches: MetaMatch[] }) {
  const parent = matches.find((m) => m.id === "routes/web/event-detail");
  const data = parent?.data as EventDetailLoaderData | undefined;

  if (!data) {
    return [
      { title: "Register - Event Not Found" },
      { name: "description", content: "Event not found" },
      { name: "robots", content: "noindex" },
    ];
  }

  const { event, community } = data;

  return [
    { title: `Register - ${event.title} - ${community.name}` },
    {
      name: "description",
      content: `Register for ${event.title} hosted by ${community.name}`,
    },
    { name: "robots", content: "noindex" },
  ];
}
