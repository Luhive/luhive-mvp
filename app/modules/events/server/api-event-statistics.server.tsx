import type { LoaderFunctionArgs } from "react-router";
import { getEventStatisticsPayload } from "~/modules/events/data/event-statistics-repo.server";
import { assertEventStatisticsAccess } from "~/modules/events/server/assert-event-statistics-access.server";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  const communityId = url.searchParams.get("communityId");

  if (!eventId || !communityId) {
    return Response.json({ error: "missing_params" }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const access = await assertEventStatisticsAccess(
    supabase,
    user.id,
    eventId,
    communityId,
  );

  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const serviceClient = createServiceRoleClient();
  const { payload, error } = await getEventStatisticsPayload(serviceClient, eventId);

  if (error || !payload) {
    console.error("Error fetching event statistics:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
