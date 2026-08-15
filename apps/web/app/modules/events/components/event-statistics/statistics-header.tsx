import { Link } from "react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";

type StatisticsHeaderProps = {
  slug: string;
  eventTitle: string;
  eventCoverUrl: string | null;
};

export function StatisticsHeader({
  slug,
  eventTitle,
  eventCoverUrl,
}: StatisticsHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/dashboard/${slug}/events`}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <div className="flex items-center gap-4">
        <div className="bg-muted h-16 w-16 shrink-0 overflow-hidden rounded-xl border">
          {eventCoverUrl ? (
            <img
              src={eventCoverUrl}
              alt={eventTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <CalendarDays className="h-6 w-6" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{eventTitle}</h1>
      </div>
    </div>
  );
}
