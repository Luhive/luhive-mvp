import { createClient } from "~/shared/lib/supabase/server";
import { getCollaborationById, acceptCollaboration, rejectCollaboration } from "~/modules/events/data/collaborations-repo.server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { Button } from "~/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { Spinner } from "~/shared/components/ui/spinner";
import { CheckCircle2, XCircle, Calendar } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase } = createClient(request);
  const collaborationId = (params as { collaborationId?: string }).collaborationId;
  const slug = (params as { slug?: string }).slug;

  if (!collaborationId) {
    throw new Response("Collaboration ID required", { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = new URL(request.url).pathname;
    throw redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  const { collaboration, error } = await getCollaborationById(supabase, collaborationId);

  if (error || !collaboration) {
    throw new Response("Collaboration not found", { status: 404 });
  }

  // Verify the collaboration belongs to the community in the URL
  const communityData = Array.isArray(collaboration.community)
    ? collaboration.community[0]
    : collaboration.community;
  
  if (!communityData || communityData.slug !== slug) {
    throw new Response("Invalid collaboration", { status: 404 });
  }

  // Verify user is owner/admin of the co-host community
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

  // Get host community details
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

  // Verify the collaboration belongs to the community in the URL
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

    // Redirect to event page
    const eventData = Array.isArray(collaboration.event)
      ? collaboration.event[0]
      : collaboration.event;
    
    if (!eventData) {
      return { success: false, error: "Event not found" };
    }
    
    const { data: hostCommunity } = await supabase
      .from("communities")
      .select("slug")
      .eq("id", eventData.community_id)
      .single();

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

    // Redirect to community page
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Collaboration Invitation</CardTitle>
          <CardDescription>
            {isAccepted
              ? "You have accepted this collaboration invitation"
              : isRejected
              ? "You have rejected this collaboration invitation"
              : "Review the collaboration invitation below"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {actionData && !actionData.success && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{actionData.error}</p>
            </div>
          )}

          {isAccepted && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">
                Collaboration accepted! The event is now visible on your community page.
              </p>
            </div>
          )}

          {isRejected && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">This collaboration invitation has been rejected.</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Event Details</h3>
              <div className="space-y-2">
                <p className="text-lg font-medium">{event.title}</p>
                {event.start_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{eventDate} {eventTime && `at ${eventTime}`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Host Community</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={hostCommunity.logo_url || undefined} alt={hostCommunity.name} />
                  <AvatarFallback>{hostCommunity.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{hostCommunity.name}</p>
                  <p className="text-sm text-muted-foreground">Event Host</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Your Community</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={coHostCommunity.logo_url || undefined} alt={coHostCommunity.name} />
                  <AvatarFallback>{coHostCommunity.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{coHostCommunity.name}</p>
                  <p className="text-sm text-muted-foreground">Co-host (if accepted)</p>
                </div>
              </div>
            </div>

            {!isAccepted && !isRejected && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  As a co-host, your community will be able to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>See the event on your community page</li>
                  <li>View event statistics on your dashboard</li>
                  <li>Track participants who register through your community</li>
                </ul>
              </div>
            )}

            {!isAccepted && !isRejected && (
              <div className="flex gap-3 pt-4">
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="reject" />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && navigation.formData?.get("intent") === "reject" ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </Form>
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="accept" />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && navigation.formData?.get("intent") === "accept" ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept Collaboration
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            )}

            {isAccepted && (
              <div className="pt-4">
                <Button asChild className="w-full">
                  <a href={`/c/${hostCommunity.slug}/events/${event.id}`}>
                    View Event
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
