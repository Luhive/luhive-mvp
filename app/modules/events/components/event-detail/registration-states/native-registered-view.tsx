import { Activity } from "react";
import { CheckinQrDialog } from "~/modules/events/components/registration/checkin-qr-dialog";
import { InviteSomeoneButton } from "~/modules/events/components/registration/invite-modal";
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

function RegisteredAttendeeLayout({
	displayName,
	avatarUrl,
	avatarInitials,
	timeFormatted,
	statusLine,
	actions,
	isUnregistering,
}: {
	displayName: string;
	avatarUrl?: string | null;
	avatarInitials?: string;
	timeFormatted?: string | null;
	statusLine: React.ReactNode;
	actions?: React.ReactNode;
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
					<div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap">
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
			statusLine={
				<RegistrationStatusLine variant="green">
					You&apos;re registered
				</RegistrationStatusLine>
			}
			actions={
				<>
					<InviteSomeoneButton
						eventId={event.id}
						label="Invite a Friend"
						size="sm"
						variant="outline"
						className="w-full sm:w-auto h-8"
					/>
					{userCheckinToken ? (
						<CheckinQrDialog
							checkinToken={userCheckinToken}
							userEmail={user?.email}
							className="w-full sm:w-auto"
						/>
					) : null}
					{discussionLink ? (
						<EventDiscussionLinkButton discussionLink={discussionLink} />
					) : null}
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
				<RegistrationStatusLine variant="amber">
					Waiting for host approval
				</RegistrationStatusLine>
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
