import { useState, useEffect } from "react";
import { useActionData, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { EventDetailActionData } from "~/modules/events/model/event-detail-view.types";

export interface UseEventDetailToastsOptions {
	onSubscribeSuccess?: () => void;
}

export interface UseEventDetailToastsResult {
	anonymousName: string | null;
	anonymousEmail: string | null;
	showCustomQuestionsForm: boolean;
	setShowCustomQuestionsForm: (v: boolean) => void;
}

/**
 * Handles toast side-effects from action data and search params, plus anonymous flow state.
 */
export function useEventDetailToasts(
	options?: UseEventDetailToastsOptions
): UseEventDetailToastsResult {
	const actionData = useActionData<EventDetailActionData>();
	const [searchParams] = useSearchParams();
	const [showCustomQuestionsForm, setShowCustomQuestionsForm] = useState(false);
	const [anonymousName, setAnonymousName] = useState<string | null>(null);
	const [anonymousEmail, setAnonymousEmail] = useState<string | null>(null);

	useEffect(() => {
		if (!actionData) return;
		if (actionData.success && actionData.message) {
			toast.success(actionData.message);
			options?.onSubscribeSuccess?.();
		} else if (actionData.error) {
			toast.error(actionData.error);
		}
		if (actionData.success && actionData.needsCustomQuestions) {
			setAnonymousName(actionData.anonymousName ?? null);
			setAnonymousEmail(actionData.anonymousEmail ?? null);
			setShowCustomQuestionsForm(true);
		}
	}, [actionData]); // onSubscribeSuccess intentionally excluded to avoid callback identity churn

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

	return {
		anonymousName,
		anonymousEmail,
		showCustomQuestionsForm,
		setShowCustomQuestionsForm,
	};
}
