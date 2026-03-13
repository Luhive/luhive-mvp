import type { ActionFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import {
  getRegistrationByCheckinToken,
  markAttended,
} from "~/modules/events/data/checkin-repo.server";

async function canManageEvent(userId: string, eventId: string, request: Request) {
  const { supabase } = createClient(request);

  const [{ data: memberships }, { data: createdCommunities }] = await Promise.all([
    supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"]),
    supabase.from("communities").select("id").eq("created_by", userId),
  ]);

  const manageableCommunityIds = new Set<string>();
  for (const membership of memberships ?? []) {
    if (membership.community_id) manageableCommunityIds.add(membership.community_id);
  }
  for (const community of createdCommunities ?? []) {
    manageableCommunityIds.add(community.id);
  }

  if (manageableCommunityIds.size === 0) {
    return false;
  }

  const { data: collaboration } = await supabase
    .from("event_collaborations")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "accepted")
    .in("role", ["host", "co-host"])
    .in("community_id", Array.from(manageableCommunityIds))
    .maybeSingle();

  return Boolean(collaboration);
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let token = "";
  let eventId = "";
  try {
    const body = (await request.json()) as { token?: string; eventId?: string };
    token = (body.token ?? "").trim();
    eventId = (body.eventId ?? "").trim();
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!token || !eventId) {
    return Response.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const isAllowed = await canManageEvent(user.id, eventId, request);
  if (!isAllowed) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();
  const { registration, error: registrationError } =
    await getRegistrationByCheckinToken(serviceClient, token, eventId);

  if (registrationError || !registration) {
    return Response.json({ error: "invalid_token" }, { status: 404 });
  }

  if (registration.approval_status !== "approved") {
    return Response.json({ error: "not_approved" }, { status: 403 });
  }

  if (registration.is_attended) {
    return Response.json({ error: "already_attended" }, { status: 409 });
  }

  const { attendedAt, error: updateError } = await markAttended(
    serviceClient,
    registration.id
  );

  if (updateError) {
    return Response.json({ error: "failed_to_mark_attended" }, { status: 500 });
  }

  const name =
    registration.anonymous_name ||
    (registration.profiles as { full_name?: string } | null)?.full_name ||
    "Attendee";

  return Response.json({
    success: true,
    name,
    attendedAt,
  });
}
