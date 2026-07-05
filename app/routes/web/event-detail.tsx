export { loader } from "~/modules/events/server/event-detail-loader.server";
export { action } from "~/modules/events/server/event-detail-action.server";
export { meta } from "~/modules/events/model/event-detail-meta";

export function shouldRevalidate({
	currentUrl,
	nextUrl,
	formMethod,
	defaultShouldRevalidate,
}: {
	currentUrl: URL;
	nextUrl: URL;
	formMethod?: string;
	defaultShouldRevalidate: boolean;
}) {
	if (formMethod && formMethod !== "GET") return defaultShouldRevalidate;

	const togglingOverlay =
		currentUrl.pathname.endsWith("/register") ||
		nextUrl.pathname.endsWith("/register");
	if (togglingOverlay) return false;

	return defaultShouldRevalidate;
}

import { Outlet, useLoaderData, useMatches } from "react-router";
import { HydrationBoundary } from "@tanstack/react-query";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { EventDetail } from "~/modules/events/components/event-detail/event-detail";
import { useEventRegistrationQuery } from "~/modules/events/hooks/use-event-registration-query";

export default function EventPublicView() {
	const loaderData = useLoaderData<EventDetailLoaderData>();

	return (
		<HydrationBoundary state={loaderData.dehydratedState}>
			<EventInner loaderData={loaderData} />
		</HydrationBoundary>
	);
}

function EventInner({ loaderData }: { loaderData: EventDetailLoaderData }) {
	const { data: pageUserState } = useEventRegistrationQuery(
		loaderData.event.id,
		loaderData.community.id,
	);

	const resolvedPageUserState = pageUserState ?? {
		isUserRegistered: loaderData.userData.isUserRegistered,
		userRegistrationStatus: loaderData.userData.userRegistrationStatus,
		userCheckinToken: loaderData.userData.userCheckinToken,
		registrationCount: loaderData.userData.registrationCount,
		user: loaderData.userData.user,
		userProfile: loaderData.userData.userProfile,
		isCommunityMember: loaderData.userData.isCommunityMember,
		canRegister: loaderData.userData.canRegister,
	};

	const pageData: EventDetailLoaderData = {
		...loaderData,
		capacityPercentage: loaderData.event.capacity
			? Math.round(
					(resolvedPageUserState.registrationCount / loaderData.event.capacity) *
						100,
				)
			: 0,
		userData: {
			...loaderData.userData,
			...resolvedPageUserState,
		},
	};

	const matches = useMatches();
	const isRegisterOpen = matches.some(
		(m) => typeof m.id === "string" && m.id.includes("event-register"),
	);

	return (
		<>
			<div
				className={isRegisterOpen ? "invisible" : undefined}
				aria-hidden={isRegisterOpen}
			>
				<EventDetail {...pageData} />
			</div>
			<Outlet />
		</>
	);
}
