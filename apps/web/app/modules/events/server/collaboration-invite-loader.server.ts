import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { getCollaborationById } from "~/modules/events/data/collaborations-repo.server";
import type { CollaborationInviteLoaderData } from "~/modules/events/model/collaboration-invite.types";

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<CollaborationInviteLoaderData> {
  const { supabase, headers } = createClient(request);
  const collaborationId = (params as { collaborationId?: string }).collaborationId;
  const slug = (params as { slug?: string }).slug;

  if (!collaborationId) {
    throw new Response("Collaboration ID required", { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = new URL(request.url).pathname + new URL(request.url).search;
    headers.append(
      "Set-Cookie",
      `pending_return_to=${encodeURIComponent(returnUrl)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    );
    throw redirect("/login", { headers });
  }

  const { collaboration, error } = await getCollaborationById(supabase, collaborationId);

  if (error || !collaboration) {
    throw new Response("Collaboration not found", { status: 404 });
  }

  const communityData = Array.isArray(collaboration.community)
    ? collaboration.community[0]
    : collaboration.community;

  if (!communityData || communityData.slug !== slug) {
    throw new Response("Invalid collaboration", { status: 404 });
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug, created_by")
    .eq("id", communityData.id)
    .single();

  if (!community) {
    throw new Response("Community not found", { status: 404 });
  }

  const isCreator = community.created_by === user.id;
  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  const isOwner =
    isCreator || (membership && (membership.role === "owner" || membership.role === "admin"));

  if (!isOwner) {
    throw new Response("Only community owners can accept collaborations", { status: 403 });
  }

  const eventData = Array.isArray(collaboration.event)
    ? collaboration.event[0]
    : collaboration.event;

  if (!eventData) {
    throw new Response("Event not found", { status: 404 });
  }

  const { data: hostCommunity } = await supabase
    .from("communities")
    .select("id, name, slug, logo_url")
    .eq("id", eventData.community_id)
    .single();

  return {
    collaboration,
    event: eventData as CollaborationInviteLoaderData["event"],
    coHostCommunity: communityData,
    hostCommunity: hostCommunity || {
      id: eventData.community_id,
      name: "Unknown",
      slug: "",
      logo_url: null,
    },
    status: collaboration.status,
  };
}
