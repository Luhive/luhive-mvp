import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase } = createClient(request);
	const {
		data: { user: authUser },
	} = await supabase.auth.getUser();

	if (!authUser) {
		return Response.json({ user: null });
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", authUser.id)
		.single();

	return Response.json({ user: profile || null });
}
