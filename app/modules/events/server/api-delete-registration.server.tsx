import type { ActionFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return { success: false, error: "Method not allowed" };
	}

	const { supabase } = createClient(request);
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { success: false, error: "Unauthorized" };
	}

	const formData = await request.formData();
	const registrationId = formData.get("registrationId") as string;
	const eventId = formData.get("eventId") as string;

	if (!registrationId || !eventId) {
		return { success: false, error: "Missing required fields" };
	}

	try {
		const { data: event, error: eventError } = await supabase
			.from("events")
			.select("*, community_id")
			.eq("id", eventId)
			.single();
		if (eventError || !event) {
			return { success: false, error: "Event not found" };
		}

		// Check if user's community is host or co-host
		const { data: collaboration } = await supabase
			.from("event_collaborations")
			.select("role")
			.eq("event_id", eventId)
			.eq("community_id", event.community_id)
			.in("role", ["host", "co-host"])
			.eq("status", "accepted")
			.single();

		if (!collaboration) {
			return { success: false, error: "You do not have permission to manage this event" };
		}

		// Verify user is owner/admin of the community
		const { data: membership, error: membershipError } = await supabase
			.from("community_members")
			.select("role")
			.eq("community_id", event.community_id)
			.eq("user_id", user.id)
			.single();
		if (membershipError || !membership || !["owner", "admin"].includes(membership.role || "")) {
			// Also check if user is the community creator
			const { data: community } = await supabase
				.from("communities")
				.select("created_by")
				.eq("id", event.community_id)
				.single();
			if (!community || community.created_by !== user.id) {
				return { success: false, error: "You do not have permission to manage this event" };
			}
		}

		const { error: deleteError } = await supabase
			.from("event_registrations")
			.delete()
			.eq("id", registrationId)
			.eq("event_id", eventId);

		if (deleteError) {
			console.error("Error deleting registration:", deleteError);
			return { success: false, error: "Failed to delete registration" };
		}

		return { success: true, message: "Registration deleted successfully" };
	} catch (error) {
		console.error("Error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
