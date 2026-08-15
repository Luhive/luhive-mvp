import { CalendarClock, PersonStanding, Hourglass } from "lucide-react";
import type { Event } from "~/shared/models/entity.types";

interface NativeClosedViewProps {
	event: Event;
	registrationCount: number;
	isPastEvent: boolean;
}

export function NativeClosedView({ event, registrationCount, isPastEvent }: NativeClosedViewProps) {
	const isFullCapacity = event.capacity != null && registrationCount >= event.capacity;

	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				{isPastEvent ? (
					<CalendarClock className="h-6 w-6 text-muted-foreground" />
				) : isFullCapacity ? (
					<PersonStanding className="h-6 w-6 text-muted-foreground" />
				) : (
					<Hourglass className="h-6 w-6 text-muted-foreground" />
				)}
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-semibold text-foreground">
					{isPastEvent
						? "This event has ended"
						: isFullCapacity
							? "Event is at full capacity"
							: "Registration is closed"}
				</p>
				<p className="text-xs text-muted-foreground">
					{isPastEvent
						? "Thank you for your interest"
						: isFullCapacity
							? "All spots have been filled"
							: "The registration deadline has passed"}
				</p>
			</div>
		</div>
	);
}
