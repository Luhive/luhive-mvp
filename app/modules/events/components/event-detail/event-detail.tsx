import { useState } from "react";
import { useSubmit, useNavigation } from "react-router";
import { AnonymousRegistrationDialog } from "~/modules/events/components/registration/anonymous-registration-dialog";
import { AnonymousSubscriptionDialog } from "~/modules/events/components/registration/anonymous-subscription-dialog";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import { useRegistrationTimer } from "~/modules/events/hooks/use-registration-timer";
import { useEventDetailToasts } from "~/modules/events/hooks/use-event-detail-toasts";
import { EventSidebarPanel } from "./event-sidebar-panel";
import { EventInfoSection } from "./event-info-section";
import type { CustomQuestionJson, ExternalPlatform } from "~/modules/events/model/event.types";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { handleShare } from "../../utils/share-event";

export function EventDetail({
	event,
	community,
	userData,
	isPastEvent,
	capacityPercentage,
	hasCustomQuestions,
	userPhone,
	isExternalEvent,
	externalPlatformName,
	registrationDeadlineFormatted,
}: EventDetailLoaderData) {
	const submit = useSubmit();
	const navigation = useNavigation();
	const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
	const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);

	const timeRemaining = useRegistrationTimer(event.registration_deadline, event.timezone);
	const {
		anonymousName,
		anonymousEmail,
		showCustomQuestionsForm,
		setShowCustomQuestionsForm,
	} = useEventDetailToasts({
		onSubscribeSuccess: () => setShowSubscribeDialog(false),
	});

	const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
	const submittingIntent = navigation.formData?.get("intent") as string | null;
	const isRegistering =
		isSubmitting &&
		(submittingIntent === "register" || submittingIntent === "anonymous-custom-questions");
	const isUnregistering = isSubmitting && submittingIntent === "unregister";

	const externalPlatform = event.external_platform as ExternalPlatform | null;


	const handleCustomQuestionsSubmit = (answers: Record<string, unknown>) => {
		const formData = new FormData();
		formData.append("intent", anonymousName ? "anonymous-custom-questions" : "register");
		formData.append("custom_answers", JSON.stringify(answers));
		if (anonymousName && anonymousEmail) {
			formData.append("name", anonymousName);
			formData.append("email", anonymousEmail);
		}
		submit(formData, { method: "POST" });
	};

	const { userProfile, user } = userData;

	return (
		<>
			<AnonymousRegistrationDialog
				open={showAnonymousDialog}
				onOpenChange={setShowAnonymousDialog}
				eventId={event.id}
				communitySlug={community.slug}
			/>
			<AnonymousSubscriptionDialog
				open={showSubscribeDialog}
				onOpenChange={setShowSubscribeDialog}
				eventId={event.id}
				communitySlug={community.slug}
			/>
			{hasCustomQuestions && (
				<CustomQuestionsForm
					open={showCustomQuestionsForm}
					onOpenChange={setShowCustomQuestionsForm}
					eventId={event.id}
					customQuestions={event.custom_questions as unknown as CustomQuestionJson}
					userName={userProfile?.full_name || undefined}
					userEmail={user?.email || undefined}
					userAvatarUrl={userProfile?.avatar_url || undefined}
					userPhone={userPhone ?? undefined}
					anonymousName={anonymousName || undefined}
					anonymousEmail={anonymousEmail || undefined}
					onSubmit={handleCustomQuestionsSubmit}
					isSubmitting={isSubmitting}
				/>
			)}
			<main className="py-6 md:py-10">
				<div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
					<EventSidebarPanel
						event={event}
						community={community}
						userData={userData}
						isPastEvent={isPastEvent}
						capacityPercentage={capacityPercentage}
						isExternalEvent={isExternalEvent}
						onShare={() => handleShare(event)}
					/>
					<EventInfoSection
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
						onShowCustomQuestionsForm={() => setShowCustomQuestionsForm(true)}
						onShowAnonymousDialog={() => setShowAnonymousDialog(true)}
						onShowSubscribeDialog={() => setShowSubscribeDialog(true)}
					/>
				</div>
			</main>
		</>
	);
}
