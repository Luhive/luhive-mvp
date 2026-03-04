import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  const email = (url.searchParams.get("email") || "").trim();

  if (email) {
    params.set("email", email);
  }

  const target = email
    ? `/auth/verify-otp?${params.toString()}`
    : "/signup";

  return redirect(target);
}

export default function VerifyEmailSentRedirectPage() {
  return null;
}
