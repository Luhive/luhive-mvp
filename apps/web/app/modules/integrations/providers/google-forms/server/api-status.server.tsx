import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase, headers } = createClient(request);

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json(
			{ connected: false, error: "Not authenticated" },
			{ status: 401, headers }
		);
	}

	try {
		const { data: tokenData, error: tokenError } = await supabase
			.from("google_forms_tokens")
			.select("id, expiry_date, updated_at")
			.eq("user_id", user.id)
			.single();

		if (tokenError || !tokenData) {
			return Response.json(
				{ connected: false, message: "Google account not connected" },
				{ headers }
			);
		}

		const isExpired = tokenData.expiry_date && new Date(tokenData.expiry_date) < new Date();
		return Response.json(
			{ connected: true, isExpired, lastUpdated: tokenData.updated_at },
			{ headers }
		);
	} catch (error) {
		console.error("Error checking Google Forms status:", error);
		return Response.json(
			{ connected: false, error: "Failed to check status" },
			{ status: 500, headers }
		);
	}
}
