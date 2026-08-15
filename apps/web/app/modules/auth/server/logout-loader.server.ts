import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSafeReturnTo } from "~/modules/auth/server/safe-return-to.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const returnTo = getSafeReturnTo(url.searchParams.get("returnTo"));

	return redirect(returnTo || "/hub");
}
