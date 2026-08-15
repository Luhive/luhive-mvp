import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import {
	createOAuth2Client,
	setCredentials,
	getForm,
	parseFormQuestions,
} from "~/modules/integrations/providers/google-forms/data/google-forms-repo.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const { supabase, headers } = createClient(request);
	const { formId } = params;

	if (!formId) {
		return Response.json({ error: "Missing form ID" }, { status: 400, headers });
	}

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json({ error: "Not authenticated" }, { status: 401, headers });
	}

	try {
		const { data: tokenData, error: tokenError } = await supabase
			.from("google_forms_tokens")
			.select("*")
			.eq("user_id", user.id)
			.single();

		if (tokenError || !tokenData) {
			return Response.json({ error: "Google account not connected" }, { status: 401, headers });
		}

		const oauth2Client = createOAuth2Client();
		setCredentials(oauth2Client, {
			access_token: tokenData.access_token,
			refresh_token: tokenData.refresh_token,
			expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null,
		});

		const formData = await getForm(oauth2Client, formId);
		const questions = parseFormQuestions(formData);

		return Response.json(
			{
				formId: formData.formId,
				info: formData.info,
				questions,
				revisionId: formData.revisionId,
				responderUri: formData.responderUri,
			},
			{ headers }
		);
	} catch (error: any) {
		console.error("Error getting form:", error);
		if (error.code === 401 || error.message?.includes("invalid_grant")) {
			return Response.json(
				{ error: "token_expired", message: "Your Google connection has expired" },
				{ status: 401, headers }
			);
		}
		return Response.json(
			{ error: "Failed to get form", message: error.message },
			{ status: 500, headers }
		);
	}
}
