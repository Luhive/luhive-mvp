import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  const intent = (formData.get("intent") as string) || "password";

  if (intent === "oauth") {
    const provider = formData.get("provider") as "google";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: new URL("/auth/verify", request.url).toString(),
      },
    });

    if (error) {
      return Response.json({ success: false, error: error.message }, { headers });
    }

    if (data?.url) {
      return redirect(data.url, { headers });
    }

    return Response.json(
      { success: false, error: "Unable to start OAuth flow." },
      { headers }
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return Response.json({ success: false, error: error.message }, { headers });
  }

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
  }

  return redirect("/hub", { headers });
}
