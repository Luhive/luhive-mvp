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

import { useEffect } from "react";
import {
	Outlet,
	useLoaderData,
	useLocation,
	useMatches,
	useRevalidator,
} from "react-router";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { EventDetail } from "~/modules/events/components/event-detail/event-detail";

export default function EventPublicView() {
	const loaderData = useLoaderData<EventDetailLoaderData>();
	const matches = useMatches();
	const location = useLocation();
	const revalidator = useRevalidator();
	const isRegisterOpen = matches.some(
		(m) => typeof m.id === "string" && m.id.includes("event-register"),
	);

	useEffect(() => {
		const state = location.state as { justRegistered?: boolean } | null;
		if (!state?.justRegistered) return;

		revalidator.revalidate();

		window.history.replaceState(
			{ ...window.history.state, usr: {} },
			"",
		);
	}, [location.key, location.state, revalidator]);

	return (
		<>
			<div className={isRegisterOpen ? "invisible" : undefined} aria-hidden={isRegisterOpen}>
				<EventDetail {...loaderData} />
			</div>
			<Outlet />
		</>
	);
}
