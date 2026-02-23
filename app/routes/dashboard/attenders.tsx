import { lazy, Suspense } from "react";
import { useLoaderData } from "react-router";
import { AttendersTableSkeleton } from "~/modules/events/components/attenders/attenders-table-skeleton";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { getEventByIdClient } from "~/modules/events/data/events-repo.client";
import { createClient } from "~/shared/lib/supabase/client";
import type { Database } from "~/shared/models/database.types";

type Event = Database["public"]["Tables"]["events"]["Row"];

type AttendersLoaderData = {
  event: Event | null;
  eventId: string | null;
  error: string | null;
};

const AttendersTable = lazy(() =>
  import("~/modules/events/components/attenders/attenders-table").then((m) => ({
    default: m.AttendersTable,
  }))
);

async function clientLoader({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}): Promise<AttendersLoaderData> {
  const slug = params.slug;
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!slug) {
    return { event: null, eventId: null, error: null };
  }

  const { community, error: communityError } =
    await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    return { event: null, eventId: null, error: "Community not found" };
  }

  if (!eventId) {
    return { event: null, eventId: null, error: null };
  }

  // First, try to get the event as host (community owns the event)
  const { event, error: eventError } = await getEventByIdClient(
    eventId,
    community.id
  );

  if (event) {
    return { event, eventId, error: null };
  }

  // If not found as host, check if community is a co-host
  try {
    const supabase = createClient();
    const { data: coHostEvent, error: coHostError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!coHostError && coHostEvent) {
      // Verify the community is a co-host of this event
      const { data: collaboration } = await supabase
        .from("event_collaborations")
        .select("role, status")
        .eq("event_id", eventId)
        .eq("community_id", community.id)
        .eq("role", "co-host")
        .eq("status", "accepted")
        .single();

      if (collaboration) {
        return { event: coHostEvent as Event, eventId, error: null };
      }
    }
  } catch (err) {
    // Silently fail and return error below
  }

  // If we reach here, the community is neither host nor accepted co-host
  if (eventError) {
    return {
      event: null,
      eventId,
      error: eventError.message || "Event not found",
    };
  }

  return {
    event: null,
    eventId,
    error: "You do not have permission to view this event's attenders",
  };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Event Attenders - Dashboard" },
    { name: "description", content: "View and manage event attenders" },
  ];
}

export default function AttendersPage() {
  const { event, eventId, error } = useLoaderData<AttendersLoaderData>();

  if (!eventId || !event) {
    return (
      <div className="py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground">
                {error || "Please select an event to view attenders."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {event.registration_type === "external"
              ? "Event Subscribers"
              : "Event Attenders"}
          </h1>
          <div className="space-y-1">
            <h2 className="text-lg font-medium">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              {event.registration_type === "external"
                ? "Manage and view all subscribers for this event"
                : "Manage and view all registered attenders for this event"}
            </p>
          </div>
        </div>

        <Suspense fallback={<AttendersTableSkeleton />}>
          <AttendersTable
            eventId={eventId}
            isExternalEvent={event.registration_type === "external"}
          />
        </Suspense>
      </div>
    </div>
  );
}
