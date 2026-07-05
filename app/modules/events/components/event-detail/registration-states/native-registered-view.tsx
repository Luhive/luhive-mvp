import { Form } from "react-router";
import { Activity } from "react";
import { Hourglass, AlertTriangle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/shared/components/ui/avatar";
import { Badge } from "~/shared/components/ui/badge";
import { CheckinQrDialog } from "~/modules/events/components/registration/checkin-qr-dialog";
import { InviteSomeoneButton } from "~/modules/events/components/registration/invite-modal";
import { useEventStartTimer } from "~/modules/events/hooks/use-event-start-timer";
import type { Event } from "~/shared/models/entity.types";

interface NativeRegisteredViewProps {
  event: Event;
  userRegistrationStatus: string | null;
  userCheckinToken: string | null;
  isPastEvent: boolean;
  isUnregistering: boolean;
  user: { id: string; email?: string | null } | null;
  userProfile: { full_name: string | null; avatar_url: string | null } | null;
}

function CancelRegistrationLink({
  isUnregistering,
}: {
  isUnregistering: boolean;
}) {
  return (
    <Form method="post">
      <input type="hidden" name="intent" value="unregister" />
      <p className="text-xs text-muted-foreground">
        Can't attend? Notify the host by{" "}
        <button
          type="submit"
          disabled={isUnregistering}
          className="text-destructive underline font-medium disabled:opacity-50"
        >
          {isUnregistering ? "canceling..." : "canceling"}
        </button>{" "}
        your registration.
      </p>
    </Form>
  );
}

function ApprovedRegisteredView({
  event,
  userCheckinToken,
  isPastEvent,
  isUnregistering,
  user,
  userProfile,
}: Omit<NativeRegisteredViewProps, "userRegistrationStatus">) {
  const timeUntilStart = useEventStartTimer(
    event.start_time,
    event.timezone,
    isPastEvent,
  );

  const avatarInitials = userProfile?.full_name
    ? userProfile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase();

  const displayName =
    userProfile?.full_name?.trim() || user?.email?.split("@")[0] || "You";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage
                src={userProfile?.avatar_url || undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
          </div>
          <p className="text-lg font-semibold text-green-600 dark:text-green-500 my-2.5">
            You&apos;re registered
          </p>
        </div>
        <CancelRegistrationLink isUnregistering={isUnregistering} />
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <Activity mode={timeUntilStart ? "visible" : "hidden"}>
          <Badge
            variant="secondary"
            className="shrink-0 border-transparent bg-muted text-muted-foreground font-normal my-2.5"
          >
            Starting in{" "}
            <span className="text-primary font-medium">
              {timeUntilStart?.formatted}
            </span>
          </Badge>
        </Activity>
        <div className="flex items-center gap-2">
          <InviteSomeoneButton
            eventId={event.id}
            label="Invite a Friend"
            size="sm"
            variant="outline"
            className="shrink-0 h-8"
          />
          {userCheckinToken ? (
            <CheckinQrDialog checkinToken={userCheckinToken} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NativeRegisteredView({
  event,
  userRegistrationStatus,
  userCheckinToken,
  isPastEvent,
  isUnregistering,
  user,
  userProfile,
}: NativeRegisteredViewProps) {
  if (userRegistrationStatus === "approved") {
    return (
      <ApprovedRegisteredView
        event={event}
        userCheckinToken={userCheckinToken}
        isPastEvent={isPastEvent}
        isUnregistering={isUnregistering}
        user={user}
        userProfile={userProfile}
      />
    );
  }

  return (
    <div className="space-y-4">
      {userRegistrationStatus === "pending" ? (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900">
          <Hourglass className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Registration Pending</p>
            <p className="text-xs opacity-90">
              Your request is waiting for approval.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Registration Rejected</p>
            <p className="text-xs opacity-90">
              Your registration request was declined.
            </p>
          </div>
        </div>
      )}

      <CancelRegistrationLink isUnregistering={isUnregistering} />
    </div>
  );
}
