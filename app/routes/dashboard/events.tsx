import React from "react";
import { EventList } from "~/modules/events/components/event-list/event-list-admin";
import { toast } from "sonner";
import { useLoaderData, useRevalidator } from "react-router";
import {
  deleteEventClient,
  getEventsWithRegistrationCountsClient,
  updateEventStatusClient,
  getCommunityCollaborationInvitesClient,
} from "~/modules/events/data/events-repo.client";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import type { Database } from "~/shared/models/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventWithCount = EventRow & { registration_count?: number };

type EventsLoaderData = {
  events: EventWithCount[];
  community: Community;
  invites: {
    id: string;
    event:
      | ({
          id: string;
          title: string;
          start_time: string | null;
          community_id: string;
          community?: { id: string; name: string; slug: string };
        })
      | null;
    invited_at: string | null;
  }[];
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

  const [{ events, error: eventsError }, { invites, error: invitesError }] =
    await Promise.all([
      getEventsWithRegistrationCountsClient(community.id),
      getCommunityCollaborationInvitesClient(community.id),
    ]);

  if (eventsError) {
    throw new Error(eventsError.message);
  }
  if (invitesError) {
    console.error("Failed to load collaboration invites:", invitesError);
  }

  return { events, community, invites: invites || [] };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Events - Dashboard" },
    { name: "description", content: "Manage your community events" },
  ];
}

export default function EventsPage() {
  const { events, community, invites } = useLoaderData<EventsLoaderData>();
  const revalidator = useRevalidator();
  const [tab, setTab] = React.useState<"events" | "invites">("events");

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
        {/* tabs */}
        <div className="mb-6 flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md border ${
              tab === "events"
                ? "bg-white border-gray-300"
                : "bg-gray-100 border-transparent"
            }`}
            onClick={() => setTab("events")}
          >
            Events
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${
              tab === "invites"
                ? "bg-white border-gray-300"
                : "bg-gray-100 border-transparent"
            }`}
            onClick={() => setTab("invites")}
          >
            Invitations{invites.length > 0 ? ` (${invites.length})` : ""}
          </button>
        </div>

        {tab === "events" && (
          <EventList
            events={events}
            communitySlug={community.slug}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}

        {tab === "invites" && (
          <div>
            {invites.length === 0 ? (
              <p className="text-center text-gray-500">No pending invites.</p>
            ) : (
              <ul className="space-y-4">
                {invites.map((invite) => {
                  const ev = invite.event;
                  if (!ev) return null;
                  const eventDate = ev.start_time
                    ? new Date(ev.start_time).toLocaleDateString()
                    : "TBD";
                  const hostName = (ev as any).community?.name;
                  return (
                    <li
                      key={invite.id}
                      className="p-4 border rounded-md flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {eventDate}
                          {hostName ? ` · Hosted by ${hostName}` : ""}
                        </p>
                      </div>
                      <a
                        href={`/c/${community.slug}/collaboration-invite/${invite.id}`}
                        className="text-orange-500 underline"
                      >
                        Respond
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
