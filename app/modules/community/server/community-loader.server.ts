import { createClient } from "~/shared/lib/supabase/server";
import { getUserAgent } from "~/modules/community/utils/user-agent";
import { getIpLocation } from "~/modules/community/utils/get-ip-location";
import {
  prepareVisitAnalytics,
  type VisitAnalytics,
} from "~/modules/community/utils/visit-tracker";
import type { LoaderFunctionArgs } from "react-router";
import type { Community } from "~/modules/community/model/community-types";

export type CommunityLoaderData = {
  community: Community | null;
  isOwner: boolean;
  isMember: boolean;
  user: { id: string; email?: string | null } | null;
  analytics: VisitAnalytics;
  memberCount: number;
  eventCount: number;
};

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<CommunityLoaderData> {
  const { supabase } = createClient(request);

  const userAgent = getUserAgent(request);
  const location = getIpLocation(request);
  const analytics = prepareVisitAnalytics(userAgent, location, false);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const slug = (params as { slug?: string }).slug;

  if (!slug) {
    return {
      community: null,
      isOwner: false,
      isMember: false,
      user: user || null,
      analytics,
      memberCount: 0,
      eventCount: 0,
    };
  }

  const { data: community, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !community) {
    throw new Response("Community not found", { status: 404 });
  }

  const isCreator = user ? community.created_by === user.id : false;

  const [membershipResult, memberCountResult, eventCountResult] =
    await Promise.all([
      user
        ? supabase
            .from("community_members")
            .select("id, role")
            .eq("user_id", user.id)
            .eq("community_id", community.id)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id)
        .eq("status", "published"),
    ]);

  // Count accepted co-host events (exclude events where this community is the host)
  let coHostCount = 0;
  try {
    const { data: coHostRows } = await supabase
      .from('event_collaborations')
      .select('event:events!event_collaborations_event_id_fkey (id, status, community_id)')
      .eq('community_id', community.id)
      .eq('status', 'accepted');

    (coHostRows || []).forEach((row: any) => {
      const event = row.event && (Array.isArray(row.event) ? row.event[0] : row.event);
      if (event && event.status === 'published' && event.community_id !== community.id) {
        coHostCount += 1;
      }
    });
  } catch (err) {
    console.error('Failed to load co-host events for community page:', err);
  }

  const isMember = !!membershipResult.data;
  const isOwner =
    isCreator ||
    (membershipResult.data &&
      (membershipResult.data.role === "owner" ||
        membershipResult.data.role === "admin"));

  return {
    community,
    isOwner,
    isMember,
    user: user || null,
    analytics,
    memberCount: memberCountResult.count || 0,
    eventCount: (eventCountResult.count || 0) + coHostCount,
  };
}
