import { lazy } from "react";
import type { Event } from "~/shared/models/entity.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";
import { cn } from "~/shared/lib/utils";

const AttendersAvatars = lazy(() =>
	import("~/modules/events/components/attenders/attenders-avatars").then((m) => ({
		default: m.default,
	})),
);

interface EventAttendeesAvatarsProps {
	event: Event;
	userData: UserData;
	isExternalEvent: boolean;
	className?: string;
}

export function EventAttendeesAvatars({
	event,
	userData,
	isExternalEvent,
	className,
}: EventAttendeesAvatarsProps) {
	return (
		<div className={cn(className)}>
			<AttendersAvatars
				eventId={event.id}
				maxVisible={5}
				isExternalEvent={isExternalEvent}
				refreshKey={userData.registrationCount}
				canViewList={
					isExternalEvent ||
					userData.isUserRegistered ||
					userData.isOwnerOrAdmin
				}
			/>
		</div>
	);
}
