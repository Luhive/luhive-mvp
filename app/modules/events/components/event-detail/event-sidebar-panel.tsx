import { Link } from "react-router";
import { Activity, Suspense, lazy } from "react";
import { Calendar, Send } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Badge } from "~/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import HostedBy from "~/modules/events/components/shared/hosted-by";
import {
	detectDiscussionPlatform,
	getPlatformName,
	getPlatformIcon,
} from "~/modules/events/utils/discussion-platform";
import {AttendersAvatarsSkeleton} from "~/modules/events/components/attenders/attender-avatars-skeleton"
import { cn } from "~/shared/lib/utils";
import type { Community, Event } from "~/shared/models/entity.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";

const AttendersAvatars = lazy(() =>
	import("~/modules/events/components/attenders/attenders-avatars").then((m) => ({ default: m.default }))
);

interface EventSidebarPanelProps {
	event: Event;
	community: Community;
	userData: UserData;
	isPastEvent: boolean;
	capacityPercentage: number;
	isExternalEvent: boolean;
	onShare: (event: Event) => void;
	hostingCommunities?: Array<{
		id: string;
		name: string;
		slug: string;
		logo_url: string | null;
		role: "host" | "co-host";
	}>;
}

export function EventSidebarPanel({
	event,
	community,
	userData,
	isPastEvent,
	capacityPercentage,
	isExternalEvent,
	onShare,
	hostingCommunities,
}: EventSidebarPanelProps) {
	const { registrationCount, canRegister } = userData;
	
	// Use hostingCommunities if provided, otherwise fall back to just the community
	const hosts = hostingCommunities && hostingCommunities.length > 0
		? hostingCommunities
		: [{ id: community.id, name: community.name, slug: community.slug, logo_url: community.logo_url, role: "host" as const }];

	return (
    <div className="contents lg:block lg:space-y-6">
      {/* Event Cover - Mobile Order 1 */}
      <div className="order-1">
        <div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden rounded-xl border shadow-sm">
          <Activity mode={event.cover_url ? "visible" : "hidden"}>
            <img
              src={event.cover_url || ""}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </Activity>
          <Activity mode={!event.cover_url ? "visible" : "hidden"}>
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="h-16 w-16 text-primary/30" />
            </div>
          </Activity>
          <Activity mode={isPastEvent ? "visible" : "hidden"}>
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge
                variant="outline"
                className="bg-black/60 text-white border-white/20"
              >
                Past Event
              </Badge>
            </div>
          </Activity>
        </div>
      </div>

      {/* Host Info, Capacity & Share - Mobile Order 3 */}
      <div className="order-3 space-y-6">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <HostedBy hosts={hosts} fallbackCommunity={community} />
          </div>

          <AttendersAvatars
            eventId={event.id}
            maxVisible={5}
            isExternalEvent={isExternalEvent}
          />
        </div>

        <Activity
          mode={
            !isExternalEvent && event.capacity && canRegister && !isPastEvent
              ? "visible"
              : "hidden"
          }
        >
          <div className="space-y-2 pt-3 lg:pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {event.capacity ? event.capacity - registrationCount : 0} spots
                left
              </span>
              <span className="font-semibold">
                {registrationCount}/{event.capacity || 0}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  capacityPercentage >= 90
                    ? "bg-red-500"
                    : capacityPercentage >= 70
                      ? "bg-yellow-500"
                      : "bg-primary",
                )}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        </Activity>

        <div className="space-y-3">
          <div className="space-y-2">
            <Button
              onClick={() => onShare(event)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Share Event
            </Button>
          </div>

          <Activity mode={event.discussion_link ? "visible" : "hidden"}>
            <div>
              {(() => {
                const platform = detectDiscussionPlatform(
                  event.discussion_link || "",
                );
                const PlatformIcon = getPlatformIcon(platform);
                const platformName = getPlatformName(platform);
                return (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <a
                      href={event.discussion_link || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PlatformIcon className="h-4 w-4 mr-2" />
                      Join Event Chat on {platformName}
                    </a>
                  </Button>
                );
              })()}
            </div>
          </Activity>
        </div>
      </div>
    </div>
  );
}
