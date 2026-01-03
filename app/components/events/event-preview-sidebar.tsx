import { useNavigate } from "react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Calendar, MapPin, Copy, ExternalLink, Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import type { Database } from "~/models/database.types";
import type { ExternalPlatform } from "~/models/event.types";
import { getExternalPlatformName, getExternalPlatformIcon } from "~/lib/utils/external-platform";
import { Badge } from "~/components/ui/badge";
import AttendersAvatars from "./attenders-avatars";

dayjs.extend(utc);
dayjs.extend(timezone);

type Event = Database["public"]["Tables"]["events"]["Row"];
type Community = Database["public"]["Tables"]["communities"]["Row"];

interface EventPreviewSidebarProps {
  event: Event | null;
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToEvent?: () => void;
  registrationCount?: number;
}

export function EventPreviewSidebar({
  event,
  community,
  open,
  onOpenChange,
  onNavigateToEvent,
  registrationCount,
}: EventPreviewSidebarProps) {
  const navigate = useNavigate();

  if (!event || !community) return null;

  const eventDate = dayjs(event.start_time).tz(event.timezone);
  const eventEndDate = event.end_time
    ? dayjs(event.end_time).tz(event.timezone)
    : null;
  const isPastEvent = eventDate.isBefore(dayjs());

  // Check if this is an external event
  const isExternalEvent = event.registration_type === "external";
  const platform = event.external_platform as ExternalPlatform | null;
  const PlatformIcon = platform ? getExternalPlatformIcon(platform) : null;

  const eventUrl = `${window.location.origin}/c/${community.slug}/events/${event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    toast.success("Event link copied to clipboard!");
  };

  const handleNavigateToEvent = () => {
    // Close sidebar first
    onOpenChange(false);
    
    // Trigger the navigation callback if provided (for instant overlay)
    if (onNavigateToEvent) {
      onNavigateToEvent();
    }
    
    // Navigate to the event page with event data in state
    navigate(`/c/${community.slug}/events/${event.id}`, {
      state: { event },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden [&>button]:hidden"
      >
        {/* Header with action buttons */}
        <SheetHeader className="shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Close sidebar</span>
            </Button>
            
            <div className="flex-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToEvent}
              className="gap-1.5"
            >
              Event Page
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <SheetTitle className="sr-only">{event.title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto event-sidebar-scrollbar">
          {/* Event Cover - 300x300px */}
          <div className="p-4 pb-0">
            <div className="relative h-[300px] w-[300px] m-auto rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background">
              {event.cover_url ? (
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Calendar className="h-16 w-16 text-primary/30" />
                </div>
              )}
              
              {/* Past Event Overlay */}
              {isPastEvent && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge
                    variant="outline"
                    className="bg-black/60 text-white border-white/20"
                  >
                    Past Event
                  </Badge>
                </div>
              )}

              {/* External badge overlay on cover */}
              {isExternalEvent && (
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant="outline"
                    className="bg-background/90 border-primary/50 text-primary"
                  >
                    {PlatformIcon ? (
                      <PlatformIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <ExternalLink className="w-3 h-3 mr-1" />
                    )}
                    {platform ? getExternalPlatformName(platform) : "External"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <h2 className="text-xl font-bold leading-tight">
              {event.title}
            </h2>

            {/* Date & Location - Side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Date Card */}
              <div className="rounded-lg bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Date</span>
                </div>
                <p className="text-sm font-semibold">
                  {eventDate.format("MMM D, YYYY")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {eventDate.format("h:mm A")}
                  {eventEndDate && ` - ${eventEndDate.format("h:mm A")}`}
                </p>
              </div>

              {/* Location Card */}
              <div className="rounded-lg bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Location</span>
                </div>
                {event.location_address ? (
                  <>
                    <p className="text-sm font-semibold truncate">
                      {event.location_address.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.location_address.split(",").slice(1).join(",").trim() || "View on map"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">
                      {event.event_type === "online" ? "Online Event" : "TBA"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_type === "online" ? "Virtual attendance" : "Location pending"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="rounded-lg bg-card p-3">
                <h3 className="text-xs text-muted-foreground font-medium mb-2">About</h3>
                <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Hosted by & Attenders - Side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Hosted by */}
              <div className="rounded-lg bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium block mb-2">Hosted by</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={community.logo_url || ""}
                      alt={community.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {community.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {community.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attenders */}
              <div className="rounded-lg bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium block mb-2">Attending</span>
                <AttendersAvatars 
                  eventId={event.id} 
                  maxVisible={4} 
                  isExternalEvent={isExternalEvent}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA with Free text */}
        <div className="shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <p className="text-lg font-bold">Free</p>
            </div>
            <Button
              onClick={handleNavigateToEvent}
              className="w-[20rem]"
              size="lg"
            >
              {isPastEvent ? (
                <>
                  View Event Details
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              ) : isExternalEvent ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe for Updates
                </>
              ) : (
                <>
                  Register
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EventPreviewSidebar;

