import { useState, useEffect } from "react";
import { getTimeRemaining } from "~/shared/lib/utils";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";

/**
 * Single-purpose countdown timer until registration deadline.
 */
export function useRegistrationTimer(
	registrationDeadline: string | null,
	timezone: string | null
): TimeRemaining | null {
	const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

	useEffect(() => {
		if (!registrationDeadline) {
			setTimeRemaining(null);
			return;
		}
		const calculate = () => {
			const remaining = getTimeRemaining(registrationDeadline, timezone ?? undefined);
			setTimeRemaining(remaining);
		};
		calculate();
		const interval = setInterval(calculate, 60000);
		return () => clearInterval(interval);
	}, [registrationDeadline, timezone]);

	return timeRemaining;
}
