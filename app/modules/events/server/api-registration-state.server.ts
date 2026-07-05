import type { LoaderFunctionArgs } from "react-router";
import {
	createClient,
	createServiceRoleClient,
} from "~/shared/lib/supabase/server";
import { fetchEventPageUserState } from "~/modules/events/server/fetch-event-page-user-state.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const eventId = url.searchParams.get("eventId");
	const communityId = url.searchParams.get("communityId");

	if (!eventId) {
		return Response.json(
			{ error: "eventId parameter is required" },
			{ status: 400 },
		);
	}

	if (!communityId) {
		return Response.json(
			{ error: "communityId parameter is required" },
			{ status: 400 },
		);
	}

	const { supabase } = createClient(request);
	const serviceClient = createServiceRoleClient();

	try {
		const state = await fetchEventPageUserState(
			supabase,
			serviceClient,
			eventId,
			communityId,
		);
		return Response.json(state);
	} catch (error) {
		console.error("Error fetching event page user state:", error);
		return Response.json(
			{ error: "Failed to fetch registration state" },
			{ status: 500 },
		);
	}
}
