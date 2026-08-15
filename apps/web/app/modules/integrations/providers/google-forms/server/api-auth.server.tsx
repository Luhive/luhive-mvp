import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { createOAuth2Client, getAuthUrl } from "~/modules/integrations/providers/google-forms/data/google-forms-repo.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase, headers } = createClient(request);

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json(
			{ error: "Not authenticated", message: "Please log in first" },
			{ status: 401, headers }
		);
	}

	try {
		const url = new URL(request.url);
		const returnTo = url.searchParams.get("returnTo") || "/dashboard";
		const oauth2Client = createOAuth2Client();
		const state = Buffer.from(JSON.stringify({ userId: user.id, returnTo })).toString("base64");
		const authUrl = getAuthUrl(oauth2Client, state);
		return redirect(authUrl, { headers });
	} catch (error) {
		console.error("Error initiating Google OAuth:", error);
		return Response.json(
			{ error: "OAuth initialization failed", message: (error as Error).message },
			{ status: 500, headers }
		);
	}
}
