import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (token_hash && type === "recovery") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "recovery",
    });

    if (!error && data.session) {
      return Response.json({ verified: true, isLoading: false }, { headers });
    }

    if (error) {
      const errorType = error.message.includes("expired")
        ? "expired-token"
        : "invalid-token";
      return redirect(`/auth/forgot-password?error=${errorType}`, { headers });
    }

    return redirect("/auth/forgot-password?error=invalid-token", { headers });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/auth/forgot-password?error=missing-token", { headers });
  }

  return Response.json({ verified: true, isLoading: false }, { headers });
}
