import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
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

  return Response.json({ user: null }, { headers });
}
