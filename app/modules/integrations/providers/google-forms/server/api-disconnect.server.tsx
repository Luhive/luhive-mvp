import type { ActionFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";

export async function action({ request }: ActionFunctionArgs) {
	const { supabase, headers } = createClient(request);

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json(
			{ error: "Not authenticated" },
			{ status: 401, headers }
		);
	}

	try {
		const { error: deleteError } = await supabase.from("google_forms_tokens").delete().eq("user_id", user.id);

		if (deleteError) {
			console.error("Error deleting tokens:", deleteError);
			return Response.json(
				{ error: "Failed to disconnect", message: deleteError.message },
				{ status: 500, headers }
			);
		}

		return Response.json(
			{ success: true, message: "Google account disconnected successfully" },
			{ headers }
		);
	} catch (error: any) {
		console.error("Error disconnecting Google:", error);
		return Response.json(
			{ error: "Failed to disconnect", message: error.message },
			{ status: 500, headers }
		);
	}
}
