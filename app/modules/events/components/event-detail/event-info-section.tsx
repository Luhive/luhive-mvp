import { Activity } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Calendar, MapPin, Video, ExternalLink } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import type { Community, Event } from "~/shared/models/entity.types";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { EventRegistrationCard } from "./event-registration-card";

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventInfoSectionProps {
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

export function EventInfoSection({
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
}: EventInfoSectionProps) {
	const { isUserRegistered } = userData;
	const tz = event.timezone ?? "UTC";
	const eventDate = dayjs(event.start_time).tz(tz);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(tz) : null;

	return (
		<div className="contents lg:block lg:space-y-6">
			<div className="order-2">
				<h1 className="text-3xl md:text-4xl font-bold leading-tight">{event.title}</h1>
			</div>

			<div className="order-4 space-y-6">
				<div className="flex items-start gap-3">
					<div className="mt-1">
						<Calendar className="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<p className="font-semibold text-base">{eventDate.format("dddd, MMMM D")}</p>
						<p className="text-sm text-muted-foreground">
							{eventDate.format("h:mm A")}
							{eventEndDate && ` - ${eventEndDate.format("h:mm A")}`} {event.timezone}
						</p>
					</div>
				</div>

				<Activity mode={event.location_address ? "visible" : "hidden"}>
					<div className="flex items-start gap-3">
						<div className="mt-1">
							<MapPin className="h-5 w-5 text-muted-foreground" />
						</div>
						<div>
							<p className="font-semibold text-base">
								{event.location_address?.split(",")[0] || ""}
							</p>
							<p className="text-sm text-muted-foreground">
								{event.location_address?.split(",").slice(1).join(",").trim() || ""}
							</p>
						</div>
					</div>
				</Activity>

				<Separator />

				<EventRegistrationCard
					event={event}
					community={community}
					userData={userData}
					timeRemaining={timeRemaining}
					registrationDeadlineFormatted={registrationDeadlineFormatted}
					hasCustomQuestions={hasCustomQuestions}
					isPastEvent={isPastEvent}
					isExternalEvent={isExternalEvent}
					externalPlatform={externalPlatform}
					externalPlatformName={externalPlatformName}
					isRegistering={isRegistering}
					isUnregistering={isUnregistering}
					isSubmitting={isSubmitting}
					onShowCustomQuestionsForm={onShowCustomQuestionsForm}
					onShowAnonymousDialog={onShowAnonymousDialog}
					onShowSubscribeDialog={onShowSubscribeDialog}
				/>

				<Activity mode={event.description ? "visible" : "hidden"}>
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">About Event</h2>
						<div className="prose prose-sm max-w-none">
							<p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
								{event.description || ""}
							</p>
						</div>
					</div>
				</Activity>

				<Activity
					mode={
						(event.event_type === "online" || event.event_type === "hybrid") &&
						!!event.online_meeting_link
							? "visible"
							: "hidden"
					}
				>
					<div className="space-y-3 pt-4 border-t">
						<h3 className="text-base font-semibold flex items-center gap-2">
							<Video className="h-4 w-4" />
							Online Meeting
						</h3>

						<Activity mode={isExternalEvent || isUserRegistered ? "visible" : "hidden"}>
							<Button asChild variant="outline" className="w-full" size="sm">
								<a
									href={event.online_meeting_link || ""}
									target="_blank"
									rel="noopener noreferrer"
								>
									Join Meeting
									<ExternalLink className="h-4 w-4 ml-2" />
								</a>
							</Button>
						</Activity>

						<Activity mode={!isExternalEvent && !isUserRegistered ? "visible" : "hidden"}>
							<p className="text-sm text-muted-foreground">
								Register to access the meeting link
							</p>
						</Activity>
					</div>
				</Activity>
			</div>
		</div>
	);
}
