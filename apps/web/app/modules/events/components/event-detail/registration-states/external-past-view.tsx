import { CalendarClock } from "lucide-react";

export function ExternalPastView() {
	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<CalendarClock className="h-6 w-6 text-muted-foreground" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-semibold text-foreground">This event has ended</p>
				<p className="text-xs text-muted-foreground">Thank you for your interest</p>
			</div>
		</div>
	);
}
