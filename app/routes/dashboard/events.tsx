import { EventList } from "~/modules/events/components/event-list/event-list-admin";
import { toast } from "sonner";
import { useLoaderData, useRevalidator } from "react-router";
import {
  deleteEventClient,
  getEventsWithRegistrationCountsClient,
  updateEventStatusClient,
} from "~/modules/events/data/events-repo.client";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import type { Database } from "~/shared/models/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventWithCount = EventRow & { registration_count?: number };

type EventsLoaderData = {
  events: EventWithCount[];
  community: Community;
};

async function clientLoader({
  params,
}: {
  params: { slug?: string };
}): Promise<EventsLoaderData> {
  const slug = params.slug;
  if (!slug) {
    throw new Error("Missing slug");
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    throw new Error("Community not found");
  }

  const { events, error: eventsError } =
    await getEventsWithRegistrationCountsClient(community.id);

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  return { events, community };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Events - Dashboard" },
    { name: "description", content: "Manage your community events" },
  ];
}

export default function EventsPage() {
  const { events, community } = useLoaderData<EventsLoaderData>();
  const revalidator = useRevalidator();

  const handleDelete = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    )
      return;
    try {
      const { error } = await deleteEventClient(eventId, community.id);
      if (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
        return;
      }
      revalidator.revalidate();
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleStatusChange = async (
    eventId: string,
    newStatus: "draft" | "published"
  ) => {
    try {
      const { error } = await updateEventStatusClient(
        eventId,
        community.id,
        newStatus
      );
      if (error) {
        console.error("Error updating event status:", error);
        toast.error("Failed to update event status");
        return;
      }
      revalidator.revalidate();
      toast.success(
        newStatus === "published"
          ? "Event published successfully"
          : "Event moved to drafts successfully"
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update event status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <EventList
          events={events}
          communitySlug={community.slug}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
