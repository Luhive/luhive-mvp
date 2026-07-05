import { useState, useEffect } from "react";
import { getTimeRemaining } from "~/shared/lib/utils";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";

/**
 * Single-purpose countdown timer until event start time.
 */
export function useEventStartTimer(
	startTime: string | null,
	timezone: string | null,
	isPastEvent: boolean,
): TimeRemaining | null {
	const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

	useEffect(() => {
		if (!startTime || isPastEvent) {
			setTimeRemaining(null);
			return;
		}
		const calculate = () => {
			const remaining = getTimeRemaining(startTime, timezone ?? undefined);
			setTimeRemaining(remaining);
		};
		calculate();
		const interval = setInterval(calculate, 60000);
		return () => clearInterval(interval);
	}, [startTime, timezone, isPastEvent]);

	return timeRemaining;
}
