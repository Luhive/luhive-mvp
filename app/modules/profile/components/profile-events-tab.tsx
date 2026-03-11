import { CalendarDays, MapPin, Video } from "lucide-react";
import { Badge } from "~/shared/components/ui/badge";
import type { ProfileEventItem } from "~/modules/profile/models/profile.types";

interface ProfileEventsTabProps {
  events: ProfileEventItem[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const EVENT_TYPE_ICON: Record<string, React.ReactNode> = {
  online: <Video className="size-3.5" />,
  "in-person": <MapPin className="size-3.5" />,
  hybrid: <MapPin className="size-3.5" />,
};

const RSVP_LABEL: Record<string, string> = {
  going: "Going",
  not_going: "Not going",
  maybe: "Maybe",
};

function EventRow({ item }: { item: ProfileEventItem }) {
  const { event, rsvp_status } = item;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <CalendarDays className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{event.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{formatDate(event.start_time)}</span>
            {EVENT_TYPE_ICON[event.event_type] && (
              <span className="flex items-center gap-0.5 capitalize">
                {EVENT_TYPE_ICON[event.event_type]}
                {event.event_type}
              </span>
            )}
          </div>
        </div>
      </div>
      <Badge
        variant={rsvp_status === "going" ? "default" : "secondary"}
        className="shrink-0"
      >
        {RSVP_LABEL[rsvp_status] ?? rsvp_status}
      </Badge>
    </div>
  );
}

export function ProfileEventsTab({ events }: ProfileEventsTabProps) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        No events yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((item) => (
        <EventRow key={item.event.id} item={item} />
      ))}
    </div>
  );
}
