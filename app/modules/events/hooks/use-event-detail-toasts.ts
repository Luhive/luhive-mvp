import { useEffect } from "react";
import { useActionData, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { EventDetailActionData } from "~/modules/events/model/event-detail-view.types";

export interface UseEventDetailToastsOptions {
	onSubscribeSuccess?: () => void;
}

/**
 * Handles toast side-effects from action data and search params.
 */
export function useEventDetailToasts(options?: UseEventDetailToastsOptions) {
	const actionData = useActionData<EventDetailActionData>();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		if (!actionData) return;
		if (actionData.success && actionData.message) {
			toast.success(actionData.message);
			options?.onSubscribeSuccess?.();
		} else if (actionData.error) {
			toast.error(actionData.error);
		}
	}, [actionData]);

	useEffect(() => {
		const verified = searchParams.get("verified");
		if (verified === "success") {
			toast.success("Email verified! You're registered for the event.");
		} else if (verified === "already") {
			toast.info("You're already registered for this event.");
		} else if (verified === "pending_approval") {
			toast.success("Email verified! Your registration is pending approval.");
		}
	}, [searchParams]);
}
