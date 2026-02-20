import { Activity } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "~/shared/components/ui/card";
import { Badge } from "~/shared/components/ui/badge";
import { AdminManagementView } from "./registration-states/admin-management-view";
import { ExternalSubscribeView } from "./registration-states/external-subscribe-view";
import { ExternalPastView } from "./registration-states/external-past-view";
import { NativeRegisteredView } from "./registration-states/native-registered-view";
import { NativeCanRegisterView } from "./registration-states/native-can-register-view";
import { NativeClosedView } from "./registration-states/native-closed-view";
import { getExternalPlatformIcon, getExternalPlatformName } from "~/modules/events/utils/external-platform";
import type { Community, Event } from "~/shared/models/entity.types";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";
import type { ExternalPlatform } from "~/modules/events/model/event.types";

interface EventRegistrationCardProps {
	event: Event;
	community: Community;
	userData: UserData;
	timeRemaining: TimeRemaining | null;
	registrationDeadlineFormatted: string;
	hasCustomQuestions: boolean;
	isPastEvent: boolean;
	isExternalEvent: boolean;
	externalPlatform: ExternalPlatform | null;
	externalPlatformName: string;
	isRegistering: boolean;
	isUnregistering: boolean;
	isSubmitting: boolean;
	onShowCustomQuestionsForm: () => void;
	onShowAnonymousDialog: () => void;
	onShowSubscribeDialog: () => void;
}

export function EventRegistrationCard({
	event,
	community,
	userData,
	timeRemaining,
	registrationDeadlineFormatted,
	hasCustomQuestions,
	isPastEvent,
	isExternalEvent,
	externalPlatform,
	externalPlatformName,
	isRegistering,
	isUnregistering,
	isSubmitting,
	onShowCustomQuestionsForm,
	onShowAnonymousDialog,
	onShowSubscribeDialog,
}: EventRegistrationCardProps) {
	const {
		registrationCount,
		isUserRegistered,
		userRegistrationStatus,
		canRegister,
		isOwnerOrAdmin,
		user,
	} = userData;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h2 className="text-xl font-semibold">
					{isOwnerOrAdmin ? "Event Management" : "Registration"}
				</h2>
				{isExternalEvent && (
					<Badge variant="outline" className="border-primary/50 bg-primary/5 text-primary">
						<ExternalLink className="h-3 w-3 mr-1" />
						External
					</Badge>
				)}
			</div>

			<Card className="bg-card/50 shadow-none transition-all border-primary/20 hover:border-primary/40">
				<CardContent className="px-4 py-0 space-y-4">
					<Activity mode={isOwnerOrAdmin ? "visible" : "hidden"}>
						<AdminManagementView event={event} community={community} isExternalEvent={isExternalEvent} />
					</Activity>

					<Activity
						mode={!isOwnerOrAdmin && isExternalEvent && !isPastEvent ? "visible" : "hidden"}
					>
						<ExternalSubscribeView
							event={event}
							externalPlatform={externalPlatform}
							externalPlatformName={externalPlatformName}
							registrationCount={registrationCount}
							isUserRegistered={isUserRegistered}
							user={user}
							isSubmitting={isSubmitting}
							onShowSubscribeDialog={onShowSubscribeDialog}
						/>
					</Activity>

					<Activity
						mode={!isOwnerOrAdmin && isExternalEvent && isPastEvent ? "visible" : "hidden"}
					>
						<ExternalPastView />
					</Activity>

					<Activity
						mode={!isOwnerOrAdmin && !isExternalEvent && isUserRegistered ? "visible" : "hidden"}
					>
						<NativeRegisteredView
							event={event}
							userRegistrationStatus={userRegistrationStatus}
							registrationCount={registrationCount}
							canRegister={canRegister}
							isPastEvent={isPastEvent}
							isUnregistering={isUnregistering}
						/>
					</Activity>

					<Activity
						mode={
							!isOwnerOrAdmin && !isExternalEvent && !isUserRegistered && canRegister
								? "visible"
								: "hidden"
						}
					>
						<NativeCanRegisterView
							event={event}
							community={community}
							userData={userData}
							timeRemaining={timeRemaining}
							registrationDeadlineFormatted={registrationDeadlineFormatted}
							hasCustomQuestions={hasCustomQuestions}
							isRegistering={isRegistering}
							isSubmitting={isSubmitting}
							onShowCustomQuestionsForm={onShowCustomQuestionsForm}
							onShowAnonymousDialog={onShowAnonymousDialog}
						/>
					</Activity>

					<Activity
						mode={
							!isOwnerOrAdmin && !isExternalEvent && !isUserRegistered && !canRegister
								? "visible"
								: "hidden"
						}
					>
						<NativeClosedView
							event={event}
							registrationCount={registrationCount}
							isPastEvent={isPastEvent}
						/>
					</Activity>
				</CardContent>
			</Card>
		</div>
	);
}
