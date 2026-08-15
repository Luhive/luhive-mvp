import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = new URL(request.url).pathname + new URL(request.url).search;
    headers.append(
      "Set-Cookie",
      `pending_return_to=${encodeURIComponent(returnUrl)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
    );
    return redirect("/login", { headers });
  }

  const formData = await request.formData();
  const fullName = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Profile updated successfully!",
  };
}
