import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";
import { resolvePublicEvent } from "~/modules/events/server/resolve-public-event.server";
import {
  completeInviteRegistration,
  ensureVerifiedAccountForInvite,
  establishSessionFromInviteToken,
  eventHasCustomQuestions,
  loadInviteWithEvent,
} from "~/modules/events/server/event-invite-accept.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    throw new Response("Invitation token is required.", { status: 400 });
  }

  const communitySlug = (params as { slug?: string }).slug;
  const eventSlug = (params as { eventSlug?: string }).eventSlug;

  if (!communitySlug || !eventSlug) {
    throw new Response("Not Found", { status: 404 });
  }

  const serviceClient = createServiceRoleClient();
  const resolved = await resolvePublicEvent(serviceClient, communitySlug, eventSlug, {
    publishedOnly: true,
  });

  if (!resolved) {
    throw new Response("Event not found", { status: 404 });
  }

  const { invite, event, error } = await loadInviteWithEvent(
    token,
    resolved.event.id,
  );

  if (!invite || !event || error) {
    throw new Response(error || "Invalid invitation.", { status: 400 });
  }

  const inviteEmail = invite.anonymous_email;
  const inviteName = invite.anonymous_name || inviteEmail?.split("@")[0] || "Guest";

  if (!inviteEmail) {
    throw new Response("Invalid invitation.", { status: 400 });
  }

  const { userId, email, tokenHash } = await ensureVerifiedAccountForInvite(
    inviteEmail,
    inviteName,
  );

  const { headers } = await establishSessionFromInviteToken(
    request,
    tokenHash,
  );

  const eventPageUrl = Routes.community.event(
    resolved.community.slug,
    publicEventSlug(resolved.event),
  );

  if (eventHasCustomQuestions(event.custom_questions)) {
    const registerUrl = `${Routes.community.eventRegister(resolved.community.slug, publicEventSlug(resolved.event))}?invite=${encodeURIComponent(token)}`;
    throw redirect(registerUrl, { headers });
  }

  const result = await completeInviteRegistration({
    request,
    invite,
    event,
    userId,
    userEmail: email,
    joinCommunity: true,
  });

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  throw redirect(eventPageUrl, { headers });
}
