import { Activity } from "react";
import { CalendarSubscriptionButton } from "~/modules/events/components/registration/calendar-subscription-dialog";
import { CheckinQrDialog } from "~/modules/events/components/registration/checkin-qr-dialog";
import { InviteSomeoneButton } from "~/modules/events/components/registration/invite-modal";
import { RegistrationEmailSpamHint } from "~/modules/events/components/registration/registration-email-spam-hint";
import { useEventStartTimer } from "~/modules/events/hooks/use-event-start-timer";
import type { Event } from "~/shared/models/entity.types";
import { EventDiscussionLinkButton } from "../event-discussion-link-button";
import { CancelRegistrationLink } from "./shared/cancel-registration-link";
import { EventStartCountdownBadge } from "./shared/event-start-countdown-badge";
import { RegistrationIdentityRow } from "./shared/registration-identity-row";
import { RegistrationStatusLine } from "./shared/registration-status-line";
import {
	getRegistrationAvatarInitials,
	getRegistrationDisplayName,
} from "./shared/registration-user-display";

interface NativeRegisteredViewProps {
	event: Event;
	communityName?: string;
	userRegistrationStatus: string | null;
	userCheckinToken: string | null;
	discussionLink?: string | null;
	isPastEvent: boolean;
	isUnregistering: boolean;
	user: { id: string; email?: string | null } | null;
	userProfile: { full_name: string | null; avatar_url: string | null } | null;
}

interface RegisteredStateViewProps {
	event: Event;
	communityName?: string;
	isPastEvent: boolean;
	isUnregistering: boolean;
	user: { id: string; email?: string | null } | null;
	userProfile: { full_name: string | null; avatar_url: string | null } | null;
}

function useRegistrationIdentity(
	user: RegisteredStateViewProps["user"],
	userProfile: RegisteredStateViewProps["userProfile"],
) {
	const displayName = getRegistrationDisplayName(userProfile, user);
	const avatarInitials = getRegistrationAvatarInitials(userProfile, user);
	return { displayName, avatarInitials };
}

const DEFAULT_ACTIONS_CLASSNAME =
	"flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap";

function RegisteredAttendeeLayout({
	displayName,
	avatarUrl,
	avatarInitials,
	timeFormatted,
	statusLine,
	actions,
	actionsClassName,
	isUnregistering,
}: {
	displayName: string;
	avatarUrl?: string | null;
	avatarInitials?: string;
	timeFormatted?: string | null;
	statusLine: React.ReactNode;
	actions?: React.ReactNode;
	actionsClassName?: string;
	isUnregistering: boolean;
}) {
	return (
		<div className="space-y-2">
			<RegistrationIdentityRow
				displayName={displayName}
				avatarUrl={avatarUrl}
				avatarInitials={avatarInitials}
				trailing={
					<Activity mode={timeFormatted ? "visible" : "hidden"}>
						<EventStartCountdownBadge formatted={timeFormatted} />
					</Activity>
				}
			/>

			<div className="space-y-3">
				{statusLine}

				{actions ? (
					<div className={actionsClassName ?? DEFAULT_ACTIONS_CLASSNAME}>
						{actions}
					</div>
				) : null}

				<CancelRegistrationLink isUnregistering={isUnregistering} />
			</div>
		</div>
	);
}

function ApprovedRegisteredView({
	event,
	communityName,
	userCheckinToken,
	discussionLink,
	isPastEvent,
	isUnregistering,
	user,
	userProfile,
}: RegisteredStateViewProps & {
	userCheckinToken: string | null;
	discussionLink?: string | null;
}) {
	const timeUntilStart = useEventStartTimer(
		event.start_time,
		event.timezone,
		isPastEvent,
	);
	const { displayName, avatarInitials } = useRegistrationIdentity(user, userProfile);

	return (
		<RegisteredAttendeeLayout
			displayName={displayName}
			avatarUrl={userProfile?.avatar_url}
			avatarInitials={avatarInitials}
			timeFormatted={timeUntilStart?.formatted}
			isUnregistering={isUnregistering}
			actionsClassName="flex flex-col gap-2 w-full sm:flex-row sm:justify-between sm:items-center"
			statusLine={
				<div className="space-y-1">
					<RegistrationStatusLine variant="green">
						You&apos;re registered
					</RegistrationStatusLine>
					<RegistrationEmailSpamHint />
				</div>
			}
			actions={
				<>
					<div className="contents sm:flex sm:flex-row sm:flex-wrap sm:justify-start sm:gap-2">
						{userCheckinToken ? (
							<CheckinQrDialog
								checkinToken={userCheckinToken}
								userEmail={user?.email}
								className="order-2 w-full sm:order-0 sm:w-auto"
							/>
						) : null}
						<CalendarSubscriptionButton
							title={event.title}
							description={event.description}
							startTime={event.start_time}
							endTime={event.end_time}
							timezone={event.timezone}
							locationAddress={event.location_address}
							onlineMeetingLink={event.online_meeting_link}
							communityName={communityName}
							className="order-4 w-full sm:order-0 sm:w-auto"
						/>
						{discussionLink ? (
							<EventDiscussionLinkButton
								discussionLink={discussionLink}
								className="order-3 sm:order-0"
							/>
						) : null}
					</div>
					<InviteSomeoneButton
						eventId={event.id}
						label="Invite a Friend"
						size="sm"
						variant="outline"
						className="order-1 w-full sm:order-0 sm:w-auto h-8 sm:shrink-0"
					/>
				</>
			}
		/>
	);
}

function PendingRegisteredView({
	event,
	isPastEvent,
	isUnregistering,
	user,
	userProfile,
}: RegisteredStateViewProps) {
	const timeUntilStart = useEventStartTimer(
		event.start_time,
		event.timezone,
		isPastEvent,
	);
	const { displayName, avatarInitials } = useRegistrationIdentity(user, userProfile);

	return (
		<RegisteredAttendeeLayout
			displayName={displayName}
			avatarUrl={userProfile?.avatar_url}
			avatarInitials={avatarInitials}
			timeFormatted={timeUntilStart?.formatted}
			isUnregistering={isUnregistering}
			statusLine={
				<div className="space-y-1">
					<RegistrationStatusLine variant="amber">
						Waiting for host approval
					</RegistrationStatusLine>
					<RegistrationEmailSpamHint />
				</div>
			}
			actions={
				<InviteSomeoneButton
					eventId={event.id}
					label="Invite a Friend"
					size="sm"
					variant="outline"
					className="w-full sm:w-auto h-8"
				/>
			}
		/>
	);
}

function RejectedRegisteredView({
	isPastEvent,
	isUnregistering,
	user,
	userProfile,
	event,
}: RegisteredStateViewProps) {
	const timeUntilStart = useEventStartTimer(
		event.start_time,
		event.timezone,
		isPastEvent,
	);
	const { displayName, avatarInitials } = useRegistrationIdentity(user, userProfile);

	return (
		<RegisteredAttendeeLayout
			displayName={displayName}
			avatarUrl={userProfile?.avatar_url}
			avatarInitials={avatarInitials}
			timeFormatted={timeUntilStart?.formatted}
			isUnregistering={isUnregistering}
			statusLine={
				<RegistrationStatusLine variant="red">
					Registration rejected
				</RegistrationStatusLine>
			}
		/>
	);
}

export function NativeRegisteredView({
	event,
	communityName,
	userRegistrationStatus,
	userCheckinToken,
	discussionLink,
	isPastEvent,
	isUnregistering,
	user,
	userProfile,
}: NativeRegisteredViewProps) {
	const stateProps: RegisteredStateViewProps = {
		event,
		communityName,
		isPastEvent,
		isUnregistering,
		user,
		userProfile,
	};

	if (userRegistrationStatus === "approved") {
		return (
			<ApprovedRegisteredView
				{...stateProps}
				userCheckinToken={userCheckinToken}
				discussionLink={discussionLink}
			/>
		);
	}

	if (userRegistrationStatus === "pending") {
		return <PendingRegisteredView {...stateProps} />;
	}

	return <RejectedRegisteredView {...stateProps} />;
}
