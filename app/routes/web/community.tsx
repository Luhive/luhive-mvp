export { loader } from "~/modules/community/server/community-loader.server";

export { action } from "~/modules/community/server/community-action.server";

export { meta } from "~/modules/community/model/community-meta";



import { useLoaderData, Link, useNavigation, useSubmit, useRevalidator, useLocation } from "react-router";
import { createClient as createClientBrowser } from "~/shared/lib/supabase/client";
import type { Database } from "~/shared/models/database.types";
import { useEffect, useState, Suspense, lazy, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { Badge } from "~/shared/components/ui/badge";
import { Spinner } from "~/shared/components/ui/spinner";
import {
  Instagram,
  Linkedin,
  MessageCircle,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  BadgeCheck,
  Heart,
  Globe,
  Link2,
  Megaphone,
  Hourglass,
} from "lucide-react";
import { Activity } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/shared/components/ui/tooltip";
import { getSessionId, shouldTrackVisit, isFirstVisit } from "~/modules/community/utils/session-tracker";
import { JoinCommunityForm } from "~/modules/community/components/join-community-form";
import { CoverPictureUpload } from "~/modules/community/components/cover-picture-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/shared/components/ui/dialog";
import { EventListSkeleton } from "~/modules/events/components/event-list/event-list";
import { EventPageSkeleton } from "~/modules/events/components/event-list/event-page-skeleton";
import { EventsListPageSkeleton } from "~/modules/events/components/event-list/events-list-page-skeleton";
import { EventPreviewSidebar } from "~/modules/events/components/event-list/event-preview-sidebar";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { toast } from "sonner";
import type { CommunityLoaderData } from "~/modules/community/server/community-loader.server";
import type { Community } from "~/modules/community/model/community-types";

type Event = Database["public"]["Tables"]["events"]["Row"];

const EventList = lazy(() =>
  import("~/modules/events/components/event-list/event-list").then((module) => ({
    default: module.EventList,
  }))
);

export default function CommunityPage() {
  const loaderData = useLoaderData<CommunityLoaderData>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const location = useLocation();
  const revalidator = useRevalidator();
  const isMobile = useIsMobile();

  const navigationState = location.state as {
    community?: Community & {
      memberCount?: number;
      eventCount?: number;
      description?: string;
      verified?: boolean;
    };
    description?: string;
    verified?: boolean;
  } | null;

  const stateCommunity = navigationState?.community;
  const isNavigating = navigation.state === "loading";
  const isNavigatingFromHub = isNavigating && !!stateCommunity;

  const skeletonCommunity = stateCommunity
    ? {
      ...stateCommunity,
      description:
        stateCommunity.description ||
        navigationState?.description ||
        undefined,
      verified: stateCommunity.verified ?? navigationState?.verified ?? false,
    }
    : null;

  const {
    community,
    isOwner,
    isMember,
    user,
    profile,
    analytics,
    memberCount,
    eventCount,
  } = loaderData;

  useEffect(() => {
    if (!community?.id) return;
    if (shouldTrackVisit(community.id)) {
      const sessionId = getSessionId();
      const firstVisit = isFirstVisit();
      const fullAnalytics = { ...analytics, isFirstVisit: firstVisit };
      const formData = new FormData();
      formData.append("intent", "track_visit");
      formData.append("communityId", community.id);
      formData.append("sessionId", sessionId);
      formData.append("analytics", JSON.stringify(fullAnalytics));
      submit(formData, { method: "post" });
    }
  }, [community?.id, analytics, submit]);

  const isDashboardLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname.includes("/dashboard/");

  const isEventsLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname?.endsWith("/events");

  const displayName = community?.name || "You Community Name";
  const displayTagline = community?.tagline || "Community Tagline";
  const displayDescription =
    community?.description || "Community Description";
  const displayLogo = community?.logo_url || "";
  const displayCover = community?.cover_url || "";
  const displayVerified = community?.verified || false;
  const shouldShowDescriptionToggle = displayDescription.length > 160;
  const formattedMemberCount =
    memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}K` : `${memberCount}`;
  const formattedEventCount =
    eventCount >= 1000 ? `${(eventCount / 1000).toFixed(1)}K` : `${eventCount}`;

  const socialLinks = community?.social_links as {
    website?: string;
    instagram?: string;
    linkedin?: string;
    whatsapp?: string;
  } | null;

  const [showStickyButton, setShowStickyButton] = useState(
    !isMember && !isOwner
  );
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventSidebarOpen, setIsEventSidebarOpen] = useState(false);
  const [eventRegistrationCount, setEventRegistrationCount] = useState<
    number | undefined
  >(undefined);
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);
  const [loadedEvents, setLoadedEvents] = useState<Event[]>([]);
  const [pendingEventsPage, setPendingEventsPage] = useState(false);
  const eventsPageOverlayRef = useRef<HTMLDivElement>(null);
  const hasScrolledToTopRef = useRef(false);

  useEffect(() => {
    if (
      pendingEventsPage &&
      eventsPageOverlayRef.current &&
      !hasScrolledToTopRef.current
    ) {
      eventsPageOverlayRef.current.scrollTop = 0;
      hasScrolledToTopRef.current = true;
    }
    if (!pendingEventsPage) {
      hasScrolledToTopRef.current = false;
    }
  }, [pendingEventsPage]);

  useEffect(() => {
    if (!pendingEventsPage && eventsPageOverlayRef.current) {
      const scrollPosition = eventsPageOverlayRef.current.scrollTop;
      if (scrollPosition > 0) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("saveOverlayScroll", { detail: scrollPosition })
          );
        }, 0);
      }
    }
  }, [pendingEventsPage]);

  useEffect(() => {
    if (navigation.state === "idle") {
      setPendingEvent(null);
      setPendingEventsPage(false);
    }
  }, [navigation.state]);

  useEffect(() => {
    if (!selectedEvent?.id) {
      setEventRegistrationCount(undefined);
      return;
    }
    const eventId = selectedEvent.id;
    async function fetchRegistrationCount() {
      try {
        const supabase = createClientBrowser();
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
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
            <EventPageSkeleton
              event={pendingEvent}
              community={community}
            />
          </div>
        </div>
      )}

      {pendingEventsPage && community && (
        <div
          ref={eventsPageOverlayRef}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
          <EventsListPageSkeleton
            events={loadedEvents}
            communitySlug={community.slug}
            community={community}
            user={user}
            onEventClick={(event) => {
              setPendingEventsPage(false);
              setPendingEvent(event);
            }}
          />
        </div>
      )}

      {/* {isDashboardLoading && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading Dashboard...
            </p>
          </div>
        </div>
      )} */}

      <Activity mode={isOwner ? "visible" : "hidden"}>
        <div className="fixed top-4 right-4 z-50">
          <div className="flex flex-col gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="group h-10 w-10 rounded-md shadow-sm hover:shadow-md transition-all duration-200 bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    aria-label="Community Dashboard"
                    asChild
                  >
                    <Link
                      to={`/dashboard/${community?.slug || "luhive"}`}
                      prefetch="intent"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="bg-popover rounded-md border border-border mr-1 shadow-lg"
                >
                  <div className="flex items-center gap-2 px-3 py-1">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Dashboard
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Activity>

      <main className={`lg:py-8 py-4 ${isMobile ? "pb-18" : ""}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto md:auto-rows-[minmax(120px,auto)]">
          <Card className="md:col-span-2 py-0 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
              {isOwner && community ? (
                <CoverPictureUpload
                  communitySlug={community.slug}
                  currentCoverUrl={displayCover}
                  onCoverUpdate={() => revalidator.revalidate()}
                />
              ) : (
                <div className="relative w-full aspect-[4/1] max-h-32 sm:max-h-36 md:max-h-40 lg:max-h-44 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background">
                  {displayCover ? (
                    <img
                      src={displayCover}
                      alt={`${displayName} cover`}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              )}

              <div className="pb-4 flex flex-col items-center justify-center text-center flex-1 space-y-4 -mt-10 sm:-mt-12">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={displayLogo} alt={displayName} />
                  <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 px-4">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {displayName}
                  </h1>
                  <p className="text-base sm:text-lg text-primary font-medium">
                    {displayTagline}
                  </p>
                  <p
                    className={`text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md ${!isDescriptionExpanded ? "line-clamp-3" : ""}`}
                  >
                    {displayDescription}
                  </p>
                  {shouldShowDescriptionToggle && (
                    <button
                      type="button"
                      onClick={() =>
                        setIsDescriptionExpanded((prev) => !prev)
                      }
                      className="text-xs sm:text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                    >
                      {isDescriptionExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-primary/30 text-primary px-3 py-1.5"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    First Adopter
                  </Badge>
                  {displayVerified && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified by Luhive
                    </Badge>
                  )}
                </div>
                <div className="flex justify-center gap-2 flex-wrap pt-2">
                  <Activity mode={socialLinks?.website ? "visible" : "hidden"}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 bg-pop rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            aria-label="Website"
                            onClick={() =>
                              window.open(
                                socialLinks?.website,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-popover border text-popover-foreground"
                        >
                          <p className="text-xs">{socialLinks?.website}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Activity>
                  <Activity mode={socialLinks?.instagram ? "visible" : "hidden"}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            aria-label="Instagram"
                            onClick={() =>
                              window.open(
                                socialLinks?.instagram,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <Instagram className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-popover border text-popover-foreground"
                        >
                          <p className="text-xs">{socialLinks?.instagram}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Activity>
                  <Activity mode={socialLinks?.linkedin ? "visible" : "hidden"}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            aria-label="LinkedIn"
                            onClick={() =>
                              window.open(
                                socialLinks?.linkedin,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-popover border text-popover-foreground"
                        >
                          <p className="text-xs">{socialLinks?.linkedin}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Activity>
                  <Activity mode={socialLinks?.whatsapp ? "visible" : "hidden"}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            aria-label="WhatsApp"
                            onClick={() =>
                              window.open(
                                socialLinks?.whatsapp,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-popover border text-popover-foreground"
                        >
                          <p className="text-xs">{socialLinks?.whatsapp}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Activity>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 grid grid-cols-2 gap-4 md:contents">
            <Card className="h-20 md:h-auto border hover:border-primary/30 transition-colors shadow-none">
              <CardContent className="p-3 md:p-6 flex flex-row md:flex-col items-center justify-center h-full text-center gap-2 md:gap-2">
                <Users className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-0">
                  <p className="text-2xl md:text-3xl font-bold text-foreground leading-none">
                    {formattedMemberCount}
                  </p>
                  <p className="text-sm md:text-sm text-muted-foreground">
                    members
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="h-20 md:h-auto border hover:border-primary/30 shadow-none">
              <CardContent className="p-3 md:p-6 flex flex-row md:flex-col items-center justify-center h-full text-center gap-2 md:gap-2">
                <Calendar className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-0">
                  <p className="text-2xl md:text-3xl font-bold text-foreground leading-none">
                    {formattedEventCount}
                  </p>
                  <p className="text-sm md:text-sm text-muted-foreground">
                    events
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="hidden md:col-span-2 md:block lg:col-span-2 lg:row-span-1 border hover:border-primary/30 transition-colors shadow-none">
            <CardHeader className="pb-2 lg:pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 lg:gap-4">
              {isOwner ? (
                <Button
                  className="w-full py-5.5 lg:py-6 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background"
                  asChild
                >
                  <Link to={`/dashboard/${community?.slug}`}>
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 opacity-90 text-foreground" />
                        <span className="text-foreground">
                          Manage Your Community
                        </span>
                      </span>
                    </span>
                  </Link>
                </Button>
              ) : (
                <JoinCommunityForm
                  communityId={community?.id || ""}
                  communityName={displayName}
                  userEmail={user?.email}
                  isLoggedIn={!!user}
                  isMember={isMember}
                />
              )}
              <Button className="w-full py-5.5 lg:py-6 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background">
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 opacity-90 text-foreground" />
                    <span className="text-foreground">Give a Feedback</span>
                  </span>
                </span>
              </Button>
              <Button
                className="w-full py-5.5 lg:py-6 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background"
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied to clipboard!");
                }}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 opacity-90 text-foreground" />
                    <span className="text-foreground">Copy Public Link</span>
                  </span>
                </span>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {community ? (
                <Suspense fallback={<EventListSkeleton />}>
                  <EventList
                    communityId={community.id}
                    communitySlug={community.slug}
                    limit={3}
                    onEventClick={(event) => {
                      setSelectedEvent(event);
                      setIsEventSidebarOpen(true);
                    }}
                    onEventsLoaded={(events) => setLoadedEvents(events)}
                  />
                </Suspense>
              ) : (
                <EventListSkeleton />
              )}
              {community && (
                <Button
                  asChild={!isEventsLoading}
                  variant="outline"
                  size="lg"
                  disabled={isEventsLoading}
                  className="mt-3 w-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {isEventsLoading ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="h-3.5 w-3.5" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <Link
                      to={`/c/${community.slug}/events`}
                      prefetch="intent"
                      state={{ community, events: loadedEvents }}
                      className="flex items-center gap-1.5"
                      onClick={() => setPendingEventsPage(true)}
                    >
                      View All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:row-span-2 lg:col-span-1 border hover:border-primary/30 transition-colors shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Hourglass className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Community announcements and updates will be available in a
                    future release.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      Learn More
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Announcements Feature
                      </DialogTitle>
                      <DialogDescription>
                        Learn about the upcoming announcements feature for your
                        community.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm">
                              Community Updates
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Share important news and updates with your
                              community members.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm">
                              Priority Messaging
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Send urgent announcements that appear prominently
                              in the community.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          This feature is currently in development and will be
                          available in a future update. Stay tuned for more
                          community management tools!
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

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
          if (selectedEvent) {
            setPendingEvent(selectedEvent);
          }
        }}
        registrationCount={eventRegistrationCount}
        user={user ? { id: user.id, email: user.email } : null}
        userProfile={user ? profile : null}
        isUserRegistered={false}
      />

      {isMobile && community && showStickyButton && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-background/0 pointer-events-none transition-opacity duration-300 ease-in-out ${showStickyButton ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div
            className={`pointer-events-auto max-w-md mx-auto transform transition-all duration-300 ease-in-out ${showStickyButton ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <JoinCommunityForm
              communityId={community.id}
              communityName={displayName}
              userEmail={user?.email}
              isLoggedIn={!!user}
              isMember={isMember}
              trigger={
                <Button className="w-full py-6 rounded-xl shadow-lg hover:shadow-xl text-base font-semibold transition-all duration-200 bg-primary hover:bg-primary/90">
                  <span className="flex items-center justify-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Join</span>
                  </span>
                </Button>
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
