import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";

function getSafeReturnTo(returnTo: string | null): string | null {
  if (!returnTo) {
    return null;
  }

  return returnTo.startsWith("/") ? returnTo : null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);

  const email = (url.searchParams.get("email") || "").trim();
  const communityId = (url.searchParams.get("communityId") || "").trim() || null;
  const returnTo = getSafeReturnTo(url.searchParams.get("returnTo"));

  if (!email) {
    return redirect("/signup", { headers });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (returnTo) {
      return redirect(returnTo, { headers });
    }

    const { data: community } = await supabase
      .from("communities")
      .select("slug")
      .eq("created_by", user.id)
      .single();

    if (community) {
      return redirect(`/c/${community.slug}`, { headers });
    }

    return redirect("/hub", { headers });
  }

  return Response.json(
    {
      email,
      communityId,
      returnTo,
    },
    { headers }
  );
}
