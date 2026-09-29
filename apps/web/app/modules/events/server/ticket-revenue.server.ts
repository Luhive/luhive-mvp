import type { LoaderFunctionArgs } from "react-router";
import { isPaidTicketingEnabled } from "@luhive/domain/v1/paid-ticketing-flag";
import {
  getCommunityPaidRevenue,
  getEventTicketRevenue,
  listCommunityTicketRevenue,
} from "~/modules/events/data/ticket-orders-repo.server";
import {
  assertEventStatisticsAccess,
  isCommunityOwnerOrAdmin,
} from "~/modules/events/server/assert-event-statistics-access.server";
import { createClient } from "~/shared/lib/supabase/server";

export async function eventRevenueLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  const communityId = url.searchParams.get("communityId");
  if (!eventId || !communityId) {
    return Response.json({ error: "Missing eventId or communityId" }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const [{ data: event }, revenue] = await Promise.all([
    supabase
      .from("events")
      .select("price_minor, currency")
      .eq("id", eventId)
      .maybeSingle(),
    getEventTicketRevenue(eventId),
  ]);

  return Response.json({
    revenueMinor: revenue.revenueMinor,
    paidCount: revenue.paidCount,
    pendingCount: revenue.pendingCount,
    currency: revenue.currency ?? event?.currency ?? "AZN",
    priced: event?.price_minor != null && event.price_minor > 0,
  });
}

export async function communityRevenueLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const communityId = url.searchParams.get("communityId");
  const hasEventFilter = url.searchParams.has("eventIds");
  const eventIds = (url.searchParams.get("eventIds") ?? "")
    .split(",")
    .filter((id) => id.length > 0);
  if (!communityId) {
    return Response.json({ error: "Missing communityId" }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await isCommunityOwnerOrAdmin(supabase, communityId, user.id);
  if (!allowed) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: community } = await supabase
    .from("communities")
    .select("settings")
    .eq("id", communityId)
    .maybeSingle();
  if (!isPaidTicketingEnabled(community?.settings)) {
    return Response.json({
      currency: "AZN",
      totalRevenueMinor: 0,
      byEventId: {},
    });
  }

  if (!hasEventFilter) {
    const revenue = await getCommunityPaidRevenue(communityId);
    return Response.json({
      currency: revenue.currency ?? "AZN",
      totalRevenueMinor: revenue.revenueMinor,
      byEventId: {},
    });
  }

  const revenue = await listCommunityTicketRevenue(communityId, eventIds);
  const totalRevenueMinor = Object.values(revenue.byEventId).reduce(
    (sum, row) => sum + row.revenueMinor,
    0,
  );

  return Response.json({
    currency: revenue.currency ?? "AZN",
    totalRevenueMinor,
    byEventId: revenue.byEventId,
  });
}
