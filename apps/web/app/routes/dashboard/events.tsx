import { Suspense, useEffect, useState } from "react";
import { EventList } from "~/modules/events/components/event-list/event-list-admin";
import { toast } from "sonner";
import { Await, useLoaderData, useRevalidator } from "react-router";
import { isPaidTicketingEnabled } from "@luhive/domain/v1/paid-ticketing-flag";
import {
  deleteEventClient,
  getEventsWithRegistrationCountsClient,
  updateEventStatusClient,
} from "~/modules/events/data/events-repo.client";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import type { EventListRevenue } from "~/modules/events/model/event-revenue.types";
import type { Database } from "~/shared/models/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventWithCount = EventRow & { registration_count?: number };

type EventsLoaderData = {
  events: EventWithCount[];
  community: Community;
  revenue: Promise<EventListRevenue | null> | null;
};

function PublishListRevenue({
  data,
  onReady,
}: {
  data: EventListRevenue | null;
  onReady: (data: EventListRevenue) => void;
}) {
  useEffect(() => {
    if (data) onReady(data);
  }, [data, onReady]);

  return null;
}

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

  const revenue = isPaidTicketingEnabled(community.settings)
    ? fetch(
        `/api/events/community-ticket-revenue?communityId=${encodeURIComponent(community.id)}&eventIds=${encodeURIComponent(events.map((event) => event.id).join(","))}`,
        { cache: "no-store" },
      ).then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as EventListRevenue;
      })
    : null;

  return { events, community, revenue };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Events - Dashboard" },
    { name: "description", content: "Manage your community events" },
  ];
}

export default function EventsPage() {
  const { events, community, revenue } = useLoaderData<EventsLoaderData>();
  const [listRevenue, setListRevenue] = useState<EventListRevenue | null>(null);
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
        {revenue && (
          <Suspense fallback={null}>
            <Await resolve={revenue}>
              {(data) => (
                <PublishListRevenue data={data} onReady={setListRevenue} />
              )}
            </Await>
          </Suspense>
        )}
        <EventList
          events={events}
          communitySlug={community.slug}
          ticketRevenue={listRevenue?.byEventId}
          showRevenue={isPaidTicketingEnabled(community.settings)}
          totalRevenue={
            listRevenue
              ? {
                  totalRevenueMinor: listRevenue.totalRevenueMinor,
                  currency: listRevenue.currency,
                }
              : null
          }
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
