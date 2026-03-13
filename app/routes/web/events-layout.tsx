import { Outlet, useParams, useLocation, useNavigation, Link, useRouteLoaderData } from "react-router";
import { useEffect, useState } from "react";
import { createClient } from "~/shared/lib/supabase/client";
import { Button } from "~/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { EventPageSkeleton } from "~/modules/events/components/event-list/event-page-skeleton";
import { EventPreviewSidebar } from "~/modules/events/components/event-list/event-preview-sidebar";
import type { Community, Event } from "~/shared/models/entity.types";
import type { CommunityLoaderData } from "~/modules/community/server/community-loader.server";

export default function EventsLayout() {
  const { slug } = useParams<{ slug: string }>();
  const parentData = useRouteLoaderData("routes/web/community") as CommunityLoaderData | undefined;
  const community = parentData?.community ?? null;
  const user = parentData?.user ?? null;
  const profile = parentData?.profile ?? null;
  const loading = !parentData;

  const location = useLocation();
  const navigation = useNavigation();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventSidebarOpen, setIsEventSidebarOpen] = useState(false);
  const [eventRegistrationCount, setEventRegistrationCount] = useState<number | undefined>(undefined);
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const isEventsListPage = location.pathname === `/c/${slug}/events`;

  useEffect(() => {
    if (navigation.state === "idle") {
      setPendingEvent(null);
    }
  }, [navigation.state]);

  useEffect(() => {
    if (!selectedEvent?.id) {
      setEventRegistrationCount(undefined);
      return;
    }
    async function fetchRegistrationCount() {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", selectedEvent?.id ?? "")
          .eq("approval_status", "approved");
        setEventRegistrationCount(count || 0);
      } catch (error) {
        console.error("Error fetching registration count:", error);
        setEventRegistrationCount(undefined);
      }
    }
    fetchRegistrationCount();
  }, [selectedEvent?.id]);

  return (
    <>
      {pendingEvent && community && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="min-h-screen container mx-auto px-4 sm:px-8">
            <EventPageSkeleton event={pendingEvent} community={community} />
          </div>
        </div>
      )}

      <div className="py-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link to={slug ? `/c/${slug}` : "#"}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </>
              ) : community ? (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={community.logo_url || ""} alt={community.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl font-bold">Events</h1>
                    <p className="text-sm text-muted-foreground">{community.name}</p>
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-xl font-bold">Events</h1>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              )}
            </div>
          </div>
          {isEventsListPage ? (
            <div className="hidden sm:inline-flex bg-muted text-muted-foreground h-9 w-[12rem] items-center justify-center rounded-lg p-[3px]">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={`inline-flex h-[calc(100%-1px)] w-[50%] items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-[color,box-shadow] ${
                  activeTab === "upcoming"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground"
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("past")}
                className={`inline-flex h-[calc(100%-1px)] w-[50%] items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-[color,box-shadow] ${
                  activeTab === "past"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground"
                }`}
              >
                Past
              </button>
            </div>
          ) : null}
        </div>
        {isEventsListPage ? (
          <div className="mt-4 sm:hidden bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-[color,box-shadow] ${
                activeTab === "upcoming"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-[color,box-shadow] ${
                activeTab === "past"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground"
              }`}
            >
              Past
            </button>
          </div>
        ) : null}
      </div>

      <Outlet
        context={{
          community,
          loading,
          slug,
          activeTab,
          onEventClick: (event: Event) => {
            setSelectedEvent(event);
            setIsEventSidebarOpen(true);
          },
        }}
      />

      <EventPreviewSidebar
        event={selectedEvent}
        community={community}
        open={isEventSidebarOpen}
        onOpenChange={(open) => {
          setIsEventSidebarOpen(open);
          if (!open) {
            setSelectedEvent(null);
            setEventRegistrationCount(undefined);
          }
        }}
        onNavigateToEvent={() => {
          if (selectedEvent) setPendingEvent(selectedEvent);
        }}
        registrationCount={eventRegistrationCount}
        user={user ? { id: user.id, email: user.email } : null}
        userProfile={profile}
        isUserRegistered={false}
      />
    </>
  );
}
