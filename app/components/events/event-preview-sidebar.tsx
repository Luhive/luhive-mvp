import { Link, useNavigate } from "react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Calendar, MapPin, ChevronRight, Copy, ExternalLink, Users } from "lucide-react";
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
}

export function EventPreviewSidebar({
  event,
  community,
  open,
  onOpenChange,
  onNavigateToEvent,
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
        <SheetHeader className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
            
            <div className="flex-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToEvent}
              className="gap-1.5"
            >
              Event Page
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
          <SheetTitle className="sr-only">{event.title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Event Cover */}
          <div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden">
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

          {/* Event Details */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <h2 className="text-2xl font-bold leading-tight">
              {event.title}
            </h2>

            {/* Host Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={community.logo_url || ""}
                  alt={community.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {community.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Hosted by</p>
                <p className="font-semibold text-sm truncate">
                  {community.name}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">
                  {eventDate.format("dddd, MMMM D, YYYY")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {eventDate.format("h:mm A")}
                  {eventEndDate && ` - ${eventEndDate.format("h:mm A")}`}
                  {" "}{event.timezone}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location_address && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-base">
                    {event.location_address.split(",")[0]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.location_address.split(",").slice(1).join(",").trim()}
                  </p>
                </div>
              </div>
            )}

            {/* Capacity (for native events) */}
            {!isExternalEvent && event.capacity && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-base">
                    {event.capacity} spots available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Limited capacity event
                  </p>
                </div>
              </div>
            )}

            {/* Description preview */}
            {event.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">About</h3>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            onClick={handleNavigateToEvent}
            className="w-full"
            size="lg"
          >
            View Full Event Details
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EventPreviewSidebar;

