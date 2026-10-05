import { Suspense } from "react";
import { Await } from "react-router";
import type { HubEventSummary } from "~/modules/hub/model/hub-v2-types";
import { ExploreEventCard } from "~/modules/hub/components/v2/explore-event-card";
import { eventGridClassName } from "~/modules/hub/components/v2/hub-grid-layout";
import { EventGridSkeleton } from "~/modules/hub/components/v2/hub-skeletons";
import { getRiseDelayMs } from "~/modules/hub/utils/get-rise-delay-ms";
import { matchesSearchQuery } from "~/modules/hub/utils/matches-search-query";

type PastEventsBlockProps = {
  pastEvents: Promise<HubEventSummary[]>;
  normalizedQuery: string;
};

type PastEventsGridProps = {
  events: HubEventSummary[];
  normalizedQuery: string;
};

function PastEventsGrid({ events, normalizedQuery }: PastEventsGridProps) {
  const matches = events.filter((event) =>
    matchesSearchQuery(normalizedQuery, [event.title, event.locationName, event.communityName]),
  );

  if (matches.length === 0) {
    return normalizedQuery ? null : (
      <p className="animate-hub-rise text-[15px] text-[#8c8e9a]">No past events yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PastEventsDivider />
      <div className={eventGridClassName}>
        {matches.map((event, index) => (
          <ExploreEventCard
            key={event.id}
            event={event}
            riseDelayMs={120 + getRiseDelayMs(index)}
            isPast
          />
        ))}
      </div>
    </div>
  );
}

function PastEventsDivider() {
  return (
    <div className="animate-hub-rise flex items-center gap-4">
      <h3 className="shrink-0 text-[18px] font-medium leading-none text-[#888] sm:text-[20px]">
        Past events
      </h3>
      <span aria-hidden className="h-px flex-1 origin-left bg-[#ededed]" />
    </div>
  );
}

export function PastEventsBlock({ pastEvents, normalizedQuery }: PastEventsBlockProps) {
  return (
    <div className="pt-2 sm:pt-4">
      <Suspense
        fallback={
          <div className="flex flex-col gap-6 sm:gap-8">
            <PastEventsDivider />
            <EventGridSkeleton count={4} />
          </div>
        }
      >
        <Await resolve={pastEvents}>
          {(events) => <PastEventsGrid events={events} normalizedQuery={normalizedQuery} />}
        </Await>
      </Suspense>
    </div>
  );
}
