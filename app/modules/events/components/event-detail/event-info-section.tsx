import { Activity } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  Calendar,
  MapPin,
  Video,
  ExternalLink,
  BarChart3,
  Navigation,
} from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import type { Community, Event } from "~/shared/models/entity.types";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import type { EventTrackingContext } from "~/modules/events/utils/event-session-tracker";
import { EventRegistrationCard } from "./event-registration-card";
import { LocationMapPreview } from "~/modules/events/components/shared/location-map-preview";
import {
  toLocationValue,
  deriveLocality,
} from "~/modules/events/utils/event-location";
import { GoogleMaps } from "~/modules/events/utils/google-maps";

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventInfoSectionProps {
	event: Event;
	community: Community;
	userData: UserData;
	timeRemaining: TimeRemaining | null;
	registrationDeadlineFormatted: string;
	hasCustomQuestions: boolean;
	isPastEvent: boolean;
	isExternalEvent: boolean;
	externalPlatform: ExternalPlatform | null;
	externalPlatformName: string;
	isRegistering: boolean;
	isUnregistering: boolean;
	isSubmitting: boolean;
	eventTrackingContext: EventTrackingContext;
	onShowCustomQuestionsForm: () => void;
	onShowRsvpModal: () => void;
	onShowSubscribeDialog: () => void;
}

export function EventInfoSection({
	event,
	community,
	userData,
	timeRemaining,
	registrationDeadlineFormatted,
	hasCustomQuestions,
	isPastEvent,
	isExternalEvent,
	externalPlatform,
	externalPlatformName,
	isRegistering,
	isUnregistering,
	isSubmitting,
	eventTrackingContext,
	onShowCustomQuestionsForm,
	onShowRsvpModal,
	onShowSubscribeDialog,
}: EventInfoSectionProps) {
 const { isUserRegistered, isOwnerOrAdmin } = userData;
	const tz = event.timezone ?? "UTC";
	const eventDate = dayjs(event.start_time).tz(tz);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(tz) : null;
	const location = toLocationValue(event);

	return (
    <div className="contents lg:block lg:space-y-6">
      <div className="order-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {event.title}
          </h1>
          <Activity mode={isOwnerOrAdmin ? "visible" : "hidden"}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
            >
              <a
                href={`/dashboard/${community.slug}/events/${event.id}/statistics`}
              >
                Insight
                <BarChart3 className="h-4 w-4" />
              </a>
            </Button>
          </Activity>
        </div>
      </div>

      <div className="order-4 space-y-6">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-base">
              {eventDate.format("dddd, MMMM D")}
            </p>
            <p className="text-sm text-muted-foreground">
              {eventDate.format("h:mm A")}
              {eventEndDate && ` - ${eventEndDate.format("h:mm A")}`}{" "}
              {event.timezone}
            </p>
          </div>
        </div>

        {/* Compact location line — Luma-style, directly under date */}
        <Activity mode={event.location_address ? "visible" : "hidden"}>
          {(() => {
            const venueName =
              location?.name || event.location_address?.split(",")[0] || "";
            const city = deriveLocality(event.location_address);
            const href = location
              ? GoogleMaps.mapsLink(location)
              : GoogleMaps.mapsSearchUrl({ address: event.location_address });
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <div className="mt-1 shrink-0">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base flex items-center gap-1 group-hover:underline">
                    {venueName}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </p>
                  {city && (
                    <p className="text-sm text-muted-foreground">{city}</p>
                  )}
                </div>
              </a>
            );
          })()}
        </Activity>

        <Separator />

        <EventRegistrationCard
          event={event}
          community={community}
          userData={userData}
          timeRemaining={timeRemaining}
          registrationDeadlineFormatted={registrationDeadlineFormatted}
          hasCustomQuestions={hasCustomQuestions}
          isPastEvent={isPastEvent}
          isExternalEvent={isExternalEvent}
          externalPlatform={externalPlatform}
          externalPlatformName={externalPlatformName}
          isRegistering={isRegistering}
          isUnregistering={isUnregistering}
          isSubmitting={isSubmitting}
          eventTrackingContext={eventTrackingContext}
          onShowCustomQuestionsForm={onShowCustomQuestionsForm}
          onShowRsvpModal={onShowRsvpModal}
          onShowSubscribeDialog={onShowSubscribeDialog}
        />

        <Activity mode={event.description ? "visible" : "hidden"}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About Event</h2>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {event.description || ""}
              </p>
            </div>
          </div>
        </Activity>

        <Activity
          mode={
            (event.event_type === "online" || event.event_type === "hybrid") &&
            !!event.online_meeting_link
              ? "visible"
              : "hidden"
          }
        >
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Online Meeting
            </h3>

            <Activity
              mode={isExternalEvent || isUserRegistered ? "visible" : "hidden"}
            >
              <Button asChild variant="outline" className="w-full" size="sm">
                <a
                  href={event.online_meeting_link || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Meeting
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </Activity>

            <Activity
              mode={
                !isExternalEvent && !isUserRegistered ? "visible" : "hidden"
              }
            >
              <p className="text-sm text-muted-foreground">
                Register to access the meeting link
              </p>
            </Activity>
          </div>
        </Activity>

        {/* Full location section — Luma-style, at the bottom */}
        <Activity mode={event.location_address ? "visible" : "hidden"}>
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold">Location</h2>

            {location ? (
              <div className="space-y-3">
                <LocationMapPreview location={location} mapHeight={220} />
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={GoogleMaps.mapsLink(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4 mr-1.5" />
                      Open in Maps
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={GoogleMaps.directionsLink(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-4 w-4 mr-1.5" />
                      Get Directions
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-base">
                  {event.location_address?.split(",")[0] || ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.location_address
                    ?.split(",")
                    .slice(1)
                    .join(",")
                    .trim() || ""}
                </p>
                <a
                  href={GoogleMaps.mapsSearchUrl({
                    address: event.location_address,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground underline inline-block hover:text-foreground"
                >
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        </Activity>
      </div>
    </div>
  );
}
