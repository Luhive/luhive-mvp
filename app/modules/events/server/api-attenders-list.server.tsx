import type { LoaderFunctionArgs } from "react-router";
import { createServiceRoleClient } from "~/shared/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const eventId = url.searchParams.get("eventId");

	if (!eventId) {
		return Response.json({ error: "eventId parameter is required" }, { status: 400 });
	}

	try {
		const serviceClient = createServiceRoleClient();

		// Service role bypasses RLS, so the event's own visibility is the only gate:
		// the roster is public exactly where the event page itself is public.
		const { data: event } = await serviceClient
			.from("events")
			.select("id, status, community:communities!events_community_id_fkey (is_show)")
			.eq("id", eventId)
			.maybeSingle();

		if (!event || event.status !== "published" || !event.community?.is_show) {
			return Response.json({ error: "Event not found" }, { status: 404 });
		}

		const { data: registrations, error } = await serviceClient
			.from("event_registrations")
			.select(`
        id,
        user_id,
        anonymous_name,
        profiles!event_registrations_user_id_fkey1 (
          id,
          full_name,
          avatar_url
        )
      `)
			.eq("event_id", eventId)
			.eq("is_verified", true)
			.eq("rsvp_status", "going")
			.eq("approval_status", "approved")
			.order("registered_at", { ascending: false });
		if (error) {
			console.error("Error fetching attendees:", error);
			return Response.json({ error: "Failed to fetch attendees" }, { status: 500 });
		}

		const attendees = (registrations || [])
			.map((reg: any) => {
				const isAnonymous = !reg.user_id;
				const name = isAnonymous ? reg.anonymous_name || "Anonymous" : reg.profiles?.full_name || "Unknown User";
				return {
					id: reg.id,
					name,
					avatar_url: isAnonymous ? null : reg.profiles?.avatar_url || null,
				};
			})
			.filter((attendee: { name: string }) => attendee.name !== "Unknown User");

		return Response.json({ attendees });
	} catch (error) {
		console.error("Error fetching attendees:", error);
		return Response.json({ error: "Failed to fetch attendees" }, { status: 500 });
	}
}
