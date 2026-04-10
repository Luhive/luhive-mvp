import { Form } from "react-router";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import calendarIcon from "~/assets/icons/calendar-03.svg";
import tagIcon from "~/assets/icons/tag-01.svg";
import type {
  CollaborationInviteActionData,
  CollaborationInviteLoaderData,
} from "~/modules/events/model/collaboration-invite.types";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CollaborationInviteViewProps = {
  event: CollaborationInviteLoaderData["event"];
  coHostCommunity: CollaborationInviteLoaderData["coHostCommunity"];
  hostCommunity: CollaborationInviteLoaderData["hostCommunity"];
  status: CollaborationInviteLoaderData["status"];
  actionData: CollaborationInviteActionData | undefined;
  isSubmitting: boolean;
  submittingIntent: string | null;
};

export function CollaborationInviteView({
  event,
  coHostCommunity,
  hostCommunity,
  status,
  actionData,
  isSubmitting,
  submittingIntent,
}: CollaborationInviteViewProps) {
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";

  const eventTime = event.start_time ? dayjs(event.start_time).format("h:mm A") : "";

  return (
    <div className="min-h-screen flex items-start justify-center p-8 bg-[#FBF7F5]">
      <div className="w-full max-w-4xl bg-white rounded-lg p-12 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-3">Collaboration Request:</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {hostCommunity.name} invited {coHostCommunity.name} to co-host an event.
          </p>

          <h2 className="text-lg font-medium mb-4">Event Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <img src={tagIcon} alt="" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Name</p>
                <p className="font-medium">{event.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <img src={calendarIcon} alt="" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {event.start_time ? dayjs(event.start_time).format("dddd, MMMM D") : "TBD"}
                </p>
                <p className="font-medium">
                  {eventTime
                    ? `${eventTime} - ${event.end_time ? dayjs(event.end_time).format("h:mm A") : ""}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-orange-50 text-orange-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{event.location_name || "Location"}</p>
                <p className="font-medium">{event.location_address || "TBD"}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm mb-3">As a co-host, you will:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Show the event on your page.</li>
              <li>Access real-time attendee stats.</li>
              <li>Track your community&apos;s registrations.</li>
            </ul>
          </div>

          {actionData && !actionData.success && actionData.error && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{actionData.error}</p>
            </div>
          )}

          {isAccepted && (
            <div className="p-4 mb-4 bg-green-50 border border-green-100 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">
                You accepted this collaboration. The event is visible on your community page.
              </p>
            </div>
          )}

          {isRejected && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                This collaboration invitation has been rejected.
              </p>
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
                  {isSubmitting && submittingIntent === "accept" ? (
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
                  {isSubmitting && submittingIntent === "reject" ? (
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
