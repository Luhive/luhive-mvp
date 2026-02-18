import type { LoaderFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase } = createClient(request);

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const userIds = url.searchParams.get("userIds");
	if (!userIds) {
		return Response.json({ error: "userIds parameter is required" }, { status: 400 });
	}

	try {
		const userIdArray = JSON.parse(userIds) as string[];
		if (!Array.isArray(userIdArray) || userIdArray.length === 0) {
			return Response.json({ emails: {} });
		}

		const serviceClient = createServiceRoleClient();
		const emailMap: Record<string, string> = {};

		await Promise.all(
			userIdArray.map(async (userId) => {
				try {
					const { data: userData, error } = await serviceClient.auth.admin.getUserById(userId);
					if (!error && userData?.user?.email) {
						emailMap[userId] = userData.user.email;
					}
				} catch (err) {
					console.warn(`Failed to fetch email for user ${userId}:`, err);
				}
			})
		);

		return Response.json({ emails: emailMap });
	} catch (error) {
		console.error("Error fetching user emails:", error);
		return Response.json({ error: "Failed to fetch emails" }, { status: 500 });
	}
}
