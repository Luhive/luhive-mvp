import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { resolvePublicEvent } from "~/modules/events/server/resolve-public-event.server";
import { loadInviteWithEvent } from "~/modules/events/server/event-invite-accept.server";
import { isInviteTokenExpired } from "~/modules/events/data/invites-repo.server";

export interface EventRegisterInviteLoaderData {
  inviteToken: string;
  inviteeName: string;
  inviteeEmail: string;
}

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<EventRegisterInviteLoaderData | null> {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get("invite")?.trim();

  if (!inviteToken) {
    return null;
  }

  const communitySlug = (params as { slug?: string }).slug;
  const eventSlug = (params as { eventSlug?: string }).eventSlug;

  if (!communitySlug || !eventSlug) {
    return null;
  }

  const { supabase } = createClient(request);
  const resolved = await resolvePublicEvent(supabase, communitySlug, eventSlug, {
    publishedOnly: true,
  });

  if (!resolved) {
    return null;
  }

  const { invite, event, error } = await loadInviteWithEvent(
    inviteToken,
    resolved.event.id,
  );

  if (!invite || !event || error || isInviteTokenExpired(invite.token_expires_at)) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  if (user.email.toLowerCase() !== (invite.anonymous_email || "").toLowerCase()) {
    return null;
  }

  return {
    inviteToken,
    inviteeName: invite.anonymous_name || user.email.split("@")[0] || "Guest",
    inviteeEmail: invite.anonymous_email || user.email,
  };
}
