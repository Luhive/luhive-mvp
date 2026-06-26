import { useLoaderData, redirect } from "react-router";

import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { StatisticsBreakdowns } from "~/modules/events/components/event-statistics/statistics-breakdowns";
import { StatisticsHeader } from "~/modules/events/components/event-statistics/statistics-header";
import { StatisticsViewsChart } from "~/modules/events/components/event-statistics/statistics-views-chart";
import { useEventStatistics } from "~/modules/events/hooks/use-event-statistics";
import type {
  EventRegistrationStatRow,
  EventStatisticsPayload,
  EventVisitStatRow,
} from "~/modules/events/model/event-statistics.types";

type EventStatisticsLoaderData = {
  slug: string;
  event: {
    id: string;
    title: string;
    start_time: string;
    cover_url: string | null;
  };
  visits: EventVisitStatRow[];
  registrations: EventRegistrationStatRow[];
};

async function clientLoader({
  params,
}: {
  params: { slug?: string; eventId?: string };
}): Promise<EventStatisticsLoaderData> {
  const slug = params.slug;
  const eventId = params.eventId;

  if (!slug || !eventId) {
    throw new Error("Missing slug or event ID");
  }

  const { community, error: communityError } = await getCommunityBySlugClient(slug);

  if (communityError || !community) {
    throw new Error("Community not found");
  }

  const response = await fetch(
    `/api/events/event-statistics?eventId=${encodeURIComponent(eventId)}&communityId=${encodeURIComponent(community.id)}`,
    { cache: "no-store" },
  );

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "post_login_return_to",
        window.location.pathname + window.location.search,
      );
    }
    throw redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Event statistics not available");
  }

  const payload = (await response.json()) as EventStatisticsPayload;

  return {
    slug,
    event: payload.event,
    visits: payload.visits,
    registrations: payload.registrations,
  };
}

export { clientLoader };

export default function EventStatisticsPage() {
  const { slug, event, visits, registrations } =
    useLoaderData<EventStatisticsLoaderData>();
  const { range, setRange, chartData, summary, sources, countries, cities } =
    useEventStatistics(visits, registrations);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-4">
          <StatisticsHeader
            slug={slug}
            eventTitle={event.title}
            eventCoverUrl={event.cover_url}
          />
        </div>
        <StatisticsViewsChart
          chartData={chartData}
          summary={summary}
          range={range}
          onRangeChange={setRange}
        />
      </div>

      <div className="px-4 lg:px-6">
        <StatisticsBreakdowns
          sources={sources}
          countries={countries}
          cities={cities}
        />
      </div>
    </div>
  );
}
