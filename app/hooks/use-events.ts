import { useEffect, useState } from "react";
import type { Database } from "~/models/database.types";
import { getEventsByCommunityClient } from "~/services/events.service";

type Event = Database["public"]["Tables"]["events"]["Row"];

export function useEvents(communityId: string | null | undefined, options?: {
  status?: string;
  startTimeGte?: string;
  startTimeLt?: string;
  order?: { column: "start_time"; ascending: boolean };
  limit?: number;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(!!communityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const result = await getEventsByCommunityClient(communityId, options);
      if (cancelled) return;

      if (result.error) {
        setEvents([]);
        setError(result.error.message);
      } else {
        setEvents(result.events);
      }

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, options?.status, options?.startTimeGte, options?.startTimeLt, options?.order?.ascending, options?.limit]);

  return { events, loading, error, setEvents };
}

