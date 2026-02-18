import { createClient } from "~/shared/lib/supabase/server";
import type { Database } from "~/shared/models/database.types";
import type { LoaderFunctionArgs } from "react-router";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Community = Database["public"]["Tables"]["communities"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface DeferredUserData {
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
  userData: Promise<DeferredUserData>;
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

  const { count: registrationCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("approval_status", "approved");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const origin = url.origin;

  const userDataPromise = (async (): Promise<DeferredUserData> => {
    const { count: regCount } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
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

    return {
      registrationCount: regCount || 0,
      isUserRegistered,
      userRegistrationStatus,
      canRegister,
      user: u || null,
      userProfile,
      isOwnerOrAdmin,
    };
  })();

  return {
    event,
    community,
    origin,
    userData: userDataPromise,
  };
}
