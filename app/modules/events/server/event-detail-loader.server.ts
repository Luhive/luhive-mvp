import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import {
  createClient,
  createServiceRoleClient,
} from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { Community, Event, Profile } from "~/shared/models/entity.types";
import { getEventCollaborations } from "~/modules/events/data/collaborations-repo.server";

dayjs.extend(timezone);

const EXTERNAL_PLATFORM_NAMES: Record<ExternalPlatform, string> = {
  google_forms: "Google Forms",
  microsoft_forms: "Microsoft Forms",
  luma: "Luma",
  eventbrite: "Eventbrite",
  other: "External Form",
};

export interface UserData {
  registrationCount: number;
  isUserRegistered: boolean;
  userRegistrationStatus: string | null;
  canRegister: boolean;
  user: { id: string; email?: string | null } | null;
  userProfile: Profile | null;
  isOwnerOrAdmin: boolean;
}

export interface EventDetailLoaderData {
  event: Event;
  community: Community;
  origin: string;
  userData: UserData;
  isPastEvent: boolean;
  capacityPercentage: number;
  hasCustomQuestions: boolean;
  userPhone: string | null;
  isExternalEvent: boolean;
  externalPlatformName: string;
  registrationDeadlineFormatted: string;
  hostingCommunities: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    role: "host" | "co-host";
    isMember: boolean;
  }>;
}

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<EventDetailLoaderData> {
  const { supabase } = createClient(request);

  const slug = (params as { slug?: string }).slug;
  const eventId = (params as { eventId?: string }).eventId;

  if (!slug || !eventId) {
    throw new Response("Not Found", { status: 404 });
  }

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (communityError || !community) {
    throw new Response("Community not found", { status: 404 });
  }

  // First try to find event in this community
  let { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("community_id", community.id)
    .single();

  // If not found, check if this community is a co-host
  if (eventError || !event) {
    const { data: collaboration } = await supabase
      .from("event_collaborations")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("community_id", community.id)
      .eq("role", "co-host")
      .eq("status", "accepted")
      .single();

    if (collaboration) {
      // Fetch the event (it belongs to host community)
      const { data: eventData, error: eventDataError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventDataError || !eventData) {
        throw new Response("Event not found", { status: 404 });
      }

      event = eventData;
      eventError = null;
    } else {
      throw new Response("Event not found", { status: 404 });
    }
  }

  if (event.status !== "published") {
    throw new Response("Event not available", { status: 404 });
  }

  const url = new URL(request.url);
  const origin = url.origin;

  const serviceClient = createServiceRoleClient();
  const { count: regCount } = await serviceClient
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("is_verified", true)
    .eq("rsvp_status", "going")
    .eq("approval_status", "approved");

  const {
    data: { user: u },
  } = await supabase.auth.getUser();
  let isUserRegistered = false;
  let userRegistrationStatus: string | null = null;
  let isOwnerOrAdmin = false;
  let userProfile: Profile | null = null;

  if (u) {
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, approval_status")
      .eq("event_id", event.id)
      .eq("user_id", u.id)
      .single();

    isUserRegistered = !!registration;
    userRegistrationStatus = registration?.approval_status || null;

    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", u.id)
      .single();

    isOwnerOrAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    userProfile = profile || null;
  }

  const now = new Date();
  const eventStartTime = new Date(event.start_time);
  const registrationDeadline = event.registration_deadline
    ? new Date(event.registration_deadline)
    : eventStartTime;

  const canRegister =
    event.status === "published" &&
    now < registrationDeadline &&
    (!event.capacity || (regCount || 0) < event.capacity);

  const userData: UserData = {
    registrationCount: regCount || 0,
    isUserRegistered,
    userRegistrationStatus,
    canRegister,
    user: u || null,
    userProfile,
    isOwnerOrAdmin,
  };

  const regCountNum = regCount || 0;
  const isPastEvent = eventStartTime < now;
  const capacityPercentage = event.capacity
    ? Math.round((regCountNum / event.capacity) * 100)
    : 0;

  const cq = event.custom_questions as {
    phone?: { enabled?: boolean };
    custom?: unknown[];
  } | null;
  const hasCustomQuestions = Boolean(
    cq && (cq.phone?.enabled || (cq.custom?.length ?? 0) > 0),
  );

  const userPhone =
    userProfile?.metadata &&
    typeof userProfile.metadata === "object" &&
    "phone" in userProfile.metadata
      ? ((userProfile.metadata as { phone?: string }).phone ?? null)
      : null;

  const isExternalEvent = event.registration_type === "external";
  const externalPlatformName =
    isExternalEvent && event.external_platform
      ? (EXTERNAL_PLATFORM_NAMES[event.external_platform as ExternalPlatform] ??
        "External Form")
      : "External Form";

  const tz = event.timezone ?? "UTC";
  const registrationDeadlineFormatted = (
    event.registration_deadline
      ? dayjs(event.registration_deadline).tz(tz)
      : dayjs(event.start_time).tz(tz)
  ).format("h:mm A z");

  // Fetch all collaborations (host + co-hosts)
  const { collaborations } = await getEventCollaborations(supabase, eventId);
  
  // Get the actual host community from the event (not from URL slug)
  const { data: hostCommunity, error: hostCommunityError } = await supabase
    .from("communities")
    .select("id, name, slug, logo_url")
    .eq("id", event.community_id)
    .single();

  if (hostCommunityError || !hostCommunity) {
    throw new Response("Host community not found", { status: 404 });
  }

  // Get all hosting communities (host + accepted co-hosts)
  let hostingCommunities: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    role: "host" | "co-host";
    isMember: boolean;
  }> = [];

  // Add host community first (always show host)
  hostingCommunities.push({
    id: hostCommunity.id,
    name: hostCommunity.name,
    slug: hostCommunity.slug,
    logo_url: hostCommunity.logo_url,
    role: "host",
    isMember: false,
  });

  // Add all accepted co-hosts (including the current community if it's a co-host)
  for (const collab of collaborations) {
    if (collab.role === "co-host" && collab.status === "accepted") {
      const coHostCommunity = Array.isArray(collab.community)
        ? collab.community[0]
        : collab.community;
      if (coHostCommunity && coHostCommunity.id !== hostCommunity.id) {
        hostingCommunities.push({
          id: coHostCommunity.id,
          name: coHostCommunity.name,
          slug: coHostCommunity.slug,
          logo_url: coHostCommunity.logo_url,
          role: "co-host",
          isMember: false,
        });
      }
    }
  }

  if (u && hostingCommunities.length > 0) {
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", u.id)
      .in("community_id", hostingCommunities.map((h) => h.id));

    const memberIds = new Set(memberships?.map((m) => m.community_id) ?? []);
    hostingCommunities = hostingCommunities.map((h) => ({
      ...h,
      isMember: memberIds.has(h.id),
    }));
  }

  return {
    event,
    community,
    origin,
    userData,
    isPastEvent,
    capacityPercentage,
    hasCustomQuestions,
    userPhone,
    isExternalEvent,
    externalPlatformName,
    registrationDeadlineFormatted,
    hostingCommunities,
  };
}
