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
		const { data: registrations, error } = await serviceClient
			.from("event_registrations")
			.select(`
        id,
        user_id,
        anonymous_name,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
			.eq("event_id", eventId)
			.eq("is_verified", true)
			.eq("rsvp_status", "going")
			.or("approval_status.is.null,approval_status.eq.approved")
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
