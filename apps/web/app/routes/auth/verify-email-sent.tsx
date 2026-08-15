import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  const email = (url.searchParams.get("email") || "").trim();
  const communityId = (url.searchParams.get("communityId") || "").trim();
  const returnTo = (url.searchParams.get("returnTo") || "").trim();

  if (email) {
    params.set("email", email);
  }

  if (communityId) {
    params.set("communityId", communityId);
  }

  if (returnTo.startsWith("/")) {
    params.set("returnTo", returnTo);
  }

  const target = email
    ? `/auth/verify-otp?${params.toString()}`
    : "/signup";

  return redirect(target);
}

export default function VerifyEmailSentRedirectPage() {
  return null;
}
