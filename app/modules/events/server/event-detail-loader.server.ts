import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import {
  createClient,
  createServiceRoleClient,
} from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { Community, Event, Profile } from "~/shared/models/entity.types";

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

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("community_id", community.id)
    .single();

  if (eventError || !event) {
    throw new Response("Event not found", { status: 404 });
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
  };
}
