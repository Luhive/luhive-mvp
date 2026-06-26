import { MapPin, Navigation } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { LocationMapPreview } from "~/modules/events/components/shared/location-map-preview";
import { toLocationValue } from "~/modules/events/utils/event-location";
import { GoogleMaps } from "~/modules/events/utils/google-maps";
import { cn } from "~/shared/lib/utils";

interface EventLocationMapSectionProps {
  event: {
    location_address?: string | null;
    location_place_id?: string | null;
    location_name?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
  };
  mapHeight?: number;
  className?: string;
  headingClassName?: string;
}

export function EventLocationMapSection({
  event,
  mapHeight = 220,
  className,
  headingClassName = "text-xl font-semibold",
}: EventLocationMapSectionProps) {
  if (!event.location_address) {
    return null;
  }

  const location = toLocationValue(event);

  return (
    <div className={cn("space-y-4 pt-4 border-t", className)}>
      <h2 className={headingClassName}>Location</h2>

      {location ? (
        <div className="space-y-3">
          <LocationMapPreview location={location} mapHeight={mapHeight} />
          {/* <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a
                href={GoogleMaps.mapsLink(location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                Open in Maps
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a
                href={GoogleMaps.directionsLink(location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4 mr-1.5" />
                Get Directions
              </a>
            </Button>
          </div> */}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-semibold text-base">
            {event.location_address.split(",")[0] || ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {event.location_address
              .split(",")
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
  );
}
