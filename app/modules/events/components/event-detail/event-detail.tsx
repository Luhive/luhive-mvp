import { useEffect, useMemo, useState } from "react";
import { useSubmit, useNavigation } from "react-router";
import { EventRsvpModal } from "~/modules/events/components/registration/event-rsvp-modal";
import { AnonymousSubscriptionDialog } from "~/modules/events/components/registration/anonymous-subscription-dialog";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import { useRegistrationTimer } from "~/modules/events/hooks/use-registration-timer";
import { useEventDetailToasts } from "~/modules/events/hooks/use-event-detail-toasts";
import { EventSidebarPanel } from "./event-sidebar-panel";
import { EventInfoSection } from "./event-info-section";
import type { CustomQuestionJson, ExternalPlatform } from "~/modules/events/model/event.types";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { handleShare } from "../../utils/share-event";
import {
	getEventTrackingContext,
	shouldTrackEventVisit,
} from "~/modules/events/utils/event-session-tracker";

async function getPublicIp(): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 1200);
		const res = await fetch("https://api.ipify.org?format=json", {
			method: "GET",
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!res.ok) return null;
		const data = (await res.json()) as { ip?: string };
		return typeof data.ip === "string" ? data.ip : null;
	} catch {
		return null;
	}
}

async function getPublicIpCached(): Promise<string | null> {
	try {
		const key = "luhive_public_ip";
		const cached = window.sessionStorage.getItem(key);
		if (cached) return cached;
		const ip = await getPublicIp();
		if (ip) window.sessionStorage.setItem(key, ip);
		return ip;
	} catch {
		return null;
	}
}

type PublicGeo = {
	ip: string;
	country: string | null;
	city: string | null;
	region: string | null;
	timezone: string | null;
};

async function getPublicGeoCached(): Promise<PublicGeo | null> {
	try {
		const key = "luhive_public_geo_v1";
		const cached = window.sessionStorage.getItem(key);
		if (cached) {
			const parsed = JSON.parse(cached) as Partial<PublicGeo>;
			if (typeof parsed.ip === "string" && parsed.ip) {
				return {
					ip: parsed.ip,
					country: typeof parsed.country === "string" ? parsed.country : null,
					city: typeof parsed.city === "string" ? parsed.city : null,
					region: typeof parsed.region === "string" ? parsed.region : null,
					timezone: typeof parsed.timezone === "string" ? parsed.timezone : null,
				};
			}
		}

		const ip = await getPublicIpCached();
		if (!ip) return null;

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 1500);
		const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
			method: "GET",
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!res.ok) return { ip, country: null, city: null, region: null, timezone: null };
		const data = (await res.json()) as any;
		const geo: PublicGeo = {
			ip,
			country: typeof data?.country === "string" ? data.country : null,
			city: typeof data?.city === "string" ? data.city : null,
			region: typeof data?.region === "string" ? data.region : null,
			timezone: typeof data?.timezone?.id === "string" ? data.timezone.id : null,
		};
		window.sessionStorage.setItem(key, JSON.stringify(geo));
		return geo;
	} catch {
		return null;
	}
}

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
	hostingCommunities,
}: EventDetailLoaderData) {
	const submit = useSubmit();
	const navigation = useNavigation();
	const [showRsvpModal, setShowRsvpModal] = useState(false);
	const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
	const [showCustomQuestionsForm, setShowCustomQuestionsForm] = useState(false);

	const timeRemaining = useRegistrationTimer(event.registration_deadline, event.timezone);
	useEventDetailToasts({
		onSubscribeSuccess: () => setShowSubscribeDialog(false),
	});

	const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
	const submittingIntent = navigation.formData?.get("intent") as string | null;
	const isRegistering = isSubmitting && submittingIntent === "register";
	const isUnregistering = isSubmitting && submittingIntent === "unregister";

	const externalPlatform = event.external_platform as ExternalPlatform | null;
	const trackingContext = useMemo(() => getEventTrackingContext(event.id), [event.id]);

	useEffect(() => {
		if (!event.id || !shouldTrackEventVisit(event.id)) {
			return;
		}

		let cancelled = false;
		(async () => {
			const geo = await getPublicGeoCached();
			if (cancelled) return;

			const formData = new FormData();
			formData.append("intent", "track_visit");
			formData.append("eventId", event.id);
			formData.append("communityId", community.id);
			formData.append("sessionId", trackingContext.sessionId);
			formData.append("utmSource", trackingContext.utmSource);
			if (geo?.ip) formData.append("clientIp", geo.ip);
			if (geo?.country) formData.append("clientCountry", geo.country);
			if (geo?.city) formData.append("clientCity", geo.city);
			if (geo?.region) formData.append("clientRegion", geo.region);
			if (geo?.timezone) formData.append("clientTimezone", geo.timezone);
			if (trackingContext.utmMedium) formData.append("utmMedium", trackingContext.utmMedium);
			if (trackingContext.utmCampaign) formData.append("utmCampaign", trackingContext.utmCampaign);
			if (trackingContext.utmContent) formData.append("utmContent", trackingContext.utmContent);
			if (trackingContext.utmTerm) formData.append("utmTerm", trackingContext.utmTerm);
			if (trackingContext.referrerUrl) formData.append("referrerUrl", trackingContext.referrerUrl);
			if (trackingContext.referrerDomain) formData.append("referrerDomain", trackingContext.referrerDomain);

			fetch(`/c/${community.slug}/events/${event.id}`, {
				method: "POST",
				body: formData,
			}).catch((error) => {
				console.error("Failed to track event visit:", error);
			});
		})();

		return () => {
			cancelled = true;
		};
	}, [
		community.id,
		community.slug,
		event.id,
		trackingContext.referrerDomain,
		trackingContext.referrerUrl,
		trackingContext.sessionId,
		trackingContext.utmCampaign,
		trackingContext.utmContent,
		trackingContext.utmMedium,
		trackingContext.utmSource,
		trackingContext.utmTerm,
	]);

	const handleCustomQuestionsSubmit = (answers: Record<string, unknown>) => {
		const formData = new FormData();
		formData.append("intent", "register");
		formData.append("custom_answers", JSON.stringify(answers));
		formData.append("eventSessionId", trackingContext.sessionId);
		formData.append("eventUtmSource", trackingContext.utmSource);
		if (trackingContext.utmMedium) formData.append("eventUtmMedium", trackingContext.utmMedium);
		if (trackingContext.utmCampaign) formData.append("eventUtmCampaign", trackingContext.utmCampaign);
		if (trackingContext.utmContent) formData.append("eventUtmContent", trackingContext.utmContent);
		if (trackingContext.utmTerm) formData.append("eventUtmTerm", trackingContext.utmTerm);
		formData.append("eventFirstVisitStartedAt", trackingContext.firstVisitStartedAt);
		submit(formData, { method: "POST" });
	};

	const { userProfile, user } = userData;

	return (
		<>
			<EventRsvpModal
				open={showRsvpModal}
				onOpenChange={setShowRsvpModal}
				eventId={event.id}
				communitySlug={community.slug}
				communityId={community.id}
				communityName={community.name}
				hasCustomQuestions={hasCustomQuestions}
				customQuestions={event.custom_questions as unknown as CustomQuestionJson}
				userPhone={userPhone ?? undefined}
				trackingContext={trackingContext}
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
						hostingCommunities={hostingCommunities}
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
						eventTrackingContext={trackingContext}
						onShowCustomQuestionsForm={() => setShowCustomQuestionsForm(true)}
						onShowRsvpModal={() => setShowRsvpModal(true)}
						onShowSubscribeDialog={() => setShowSubscribeDialog(true)}
					/>
				</div>
			</main>
		</>
	);
}
