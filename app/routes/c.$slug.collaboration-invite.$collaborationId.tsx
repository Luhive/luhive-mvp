import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { getCollaborationById, acceptCollaboration, rejectCollaboration } from "~/modules/events/data/collaborations-repo.server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Button } from "~/shared/components/ui/button";
import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { Spinner } from "~/shared/components/ui/spinner";
import { CheckCircle2, XCircle, Calendar, MapPin, Tag } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import calendar from "../assets/icons/calendar-03.svg";
import tag from "../assets/icons/tag-01.svg";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function loader({ request, params }: LoaderFunctionArgs) {
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
      `pending_return_to=${encodeURIComponent(returnUrl)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
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

  const isOwner = isCreator || (membership && (membership.role === "owner" || membership.role === "admin"));

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
    event: eventData,
    coHostCommunity: communityData,
    hostCommunity: hostCommunity || { id: eventData.community_id, name: "Unknown", slug: "", logo_url: null },
    status: collaboration.status,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const collaborationId = (params as { collaborationId?: string }).collaborationId;
  const slug = (params as { slug?: string }).slug;

  if (!collaborationId) {
    return { success: false, error: "Collaboration ID required" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { collaboration, error: collabError } = await getCollaborationById(supabase, collaborationId);

  if (collabError || !collaboration) {
    return { success: false, error: "Collaboration not found" };
  }

  const communityData = Array.isArray(collaboration.community)
    ? collaboration.community[0]
    : collaboration.community;
  
  if (!communityData || communityData.slug !== slug) {
    return { success: false, error: "Invalid collaboration" };
  }

  if (intent === "accept") {
    const { collaboration: acceptedCollab, error: acceptError } = await acceptCollaboration(
      supabase,
      collaborationId
    );

    if (acceptError || !acceptedCollab) {
      return {
        success: false,
        error: acceptError?.message || "Failed to accept collaboration",
      };
    }

    // Get event data
    const eventData = Array.isArray(collaboration.event)
      ? collaboration.event[0]
      : collaboration.event;
    
    if (!eventData) {
      return { success: false, error: "Event not found" };
    }

    // Get co-host community info (this is the community the user represents)
    const coHostCommunityData = Array.isArray(collaboration.community)
      ? collaboration.community[0]
      : collaboration.community;

    // Get host community details
    const { data: hostCommunity } = await supabase
      .from("communities")
      .select("id, name, slug, created_by")
      .eq("id", eventData.community_id)
      .single();

    if (!hostCommunity) {
      return { success: false, error: "Host community not found" };
    }

    // Check if this is a new event or existing event
    const collaborationCreatedAt = new Date(collaboration.created_at);
    const eventCreatedAt = eventData.created_at ? new Date(eventData.created_at) : null;
    
    let isNewEvent = false;
    if (eventCreatedAt && collaborationCreatedAt) {
      const timeDiff = Math.abs(collaborationCreatedAt.getTime() - eventCreatedAt.getTime());
      isNewEvent = timeDiff < 5 * 60 * 1000; // 5 minutes
    }

    // Format event date/time
    const eventDateTime = eventData.start_time ? new Date(eventData.start_time) : null;
    const eventDate = eventDateTime ? eventDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';
    const eventTime = eventDateTime ? eventDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'TBD';

    const eventLink = `${new URL(request.url).origin}/c/${hostCommunity.slug}/events/${eventData.id}`;

    console.log("=== Collaboration Notification Debug ===");
    console.log("isNewEvent:", isNewEvent);
    console.log("event.created_at:", eventData.created_at);
    console.log("collaboration.created_at:", collaboration.created_at);
    console.log("hostCommunity.id:", hostCommunity.id);
    console.log("hostCommunity.name:", hostCommunity.name);
    console.log("coHostCommunityId:", coHostCommunityData?.id);
    
    const notificationType = isNewEvent ? 'collaboration-accepted-new-event' : 'collaboration-accepted-existing-event';
    console.log("notificationType:", notificationType);
    
    try {
      const response = await fetch(`${new URL(request.url).origin}/api/events/collaboration-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notificationType,
          eventId: eventData.id,
          hostCommunityId: hostCommunity.id,
          hostCommunityName: hostCommunity.name,
          coHostCommunityId: coHostCommunityData?.id,
          eventTitle: eventData.title,
          eventDate,
          eventTime,
          eventLink,
          locationAddress: eventData.location_address || undefined,
          onlineMeetingLink: eventData.online_meeting_link || undefined,
        }),
      });
      
      const responseText = await response.text();
      console.log("Notification API response status:", response.status);
      console.log("Notification API response:", responseText);
    } catch (notifyError) {
      console.error("Failed to trigger community notifications:", notifyError);
    }

    // Redirect to event page
    if (hostCommunity) {
      return redirect(`/c/${hostCommunity.slug}/events/${eventData.id}`);
    }

    return { success: true };
  }

  if (intent === "reject") {
    const { collaboration: rejectedCollab, error: rejectError } = await rejectCollaboration(
      supabase,
      collaborationId
    );

    if (rejectError || !rejectedCollab) {
      return {
        success: false,
        error: rejectError?.message || "Failed to reject collaboration",
      };
    }

    return redirect(`/c/${slug}`);
  }

  return { success: false, error: "Invalid intent" };
}

export default function CollaborationInvitePage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const { collaboration, event, coHostCommunity, hostCommunity, status } = loaderData;
  const isSubmitting = navigation.state === "submitting";
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";

  const eventDate = event.start_time ? dayjs(event.start_time).format("MMMM D, YYYY") : "TBD";
  const eventTime = event.start_time ? dayjs(event.start_time).format("h:mm A") : "";

  return (
    <div className="min-h-screen flex items-start justify-center p-8 bg-[#FBF7F5]">
      <div className="w-full max-w-4xl bg-white rounded-lg p-12 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-3">Collaboration Request:</h1>
          <p className="text-sm text-muted-foreground mb-8">{hostCommunity.name} invited {coHostCommunity.name} to co-host an event.</p>

          <h2 className="text-lg font-medium mb-4">Event Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <img src={tag} alt="" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Name</p>
                <p className="font-medium">{event.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <img src={calendar} alt=""className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{dayjs(event.start_time).format('dddd, MMMM D')}</p>
                <p className="font-medium">{eventTime ? `${eventTime} - ${dayjs(event.end_time).format('h:mm A') || ''}` : ''}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{event.location_name || 'Location'}</p>
                <p className="font-medium">{event.location_address || 'TBD'}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm mb-3">As a co-host, you will:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Show the event on your page.</li>
              <li>Access real-time attendee stats.</li>
              <li>Track your community's registrations.</li>
            </ul>
          </div>

          {actionData && !actionData.success && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{actionData.error}</p>
            </div>
          )}

          {isAccepted && (
            <div className="p-4 mb-4 bg-green-50 border border-green-100 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">You accepted this collaboration. The event is visible on your community page.</p>
            </div>
          )}

          {isRejected && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">This collaboration invitation has been rejected.</p>
            </div>
          )}

          {!isAccepted && !isRejected && (
            <div className="flex gap-2">
              <Form method="post" className="">
                <input type="hidden" name="intent" value="accept" />
                <Button
                  type="submit"
                  className="w-max rounded-md px-6 py-3 bg-gradient-to-b from-orange-500 to-orange-400 shadow-md text-white hover:from-orange-600 hover:to-orange-500"
                >
                  {isSubmitting && navigation.formData?.get("intent") === "accept" ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Accepting...
                    </>
                  ) : (
                    <span>Accept Invitation</span>
                  )}
                </Button>
              </Form>

              <Form method="post" className="">
                <input type="hidden" name="intent" value="reject" />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-max rounded-md px-6 py-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {isSubmitting && navigation.formData?.get("intent") === "reject" ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Rejecting...
                    </>
                  ) : (
                    <span>Reject</span>
                  )}
                </Button>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
