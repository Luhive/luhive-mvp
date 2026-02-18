import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { registerSchema } from "~/modules/auth/model/auth-schema";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  const intent = (formData.get("intent") as string) || "password";

  if (intent === "oauth") {
    const provider = formData.get("provider") as "google";
    const communityId = formData.get("communityId") as string | null;

    if (communityId) {
      headers.append(
        "Set-Cookie",
        `pending_community_id=${communityId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
      );
    }

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

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const communityId = formData.get("communityId") as string | null;

  const validation = registerSchema.safeParse({ name, surname, email, password });

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return Response.json(
      { success: false, errors, fieldErrors: errors },
      { headers }
    );
  }

  const fullName = `${name} ${surname}`.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        pending_community_id: communityId || null,
        full_name: fullName,
      },
    },
  });

  if (error) {
    return Response.json({ success: false, error: error.message }, { headers });
  }

  if (!data.user) {
    return Response.json(
      { success: false, error: "Failed to create user account" },
      { headers }
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    metadata: { referral_community_id: communityId },
  });

  if (profileError) {
    return Response.json(
      { success: false, error: "Failed to create user account" },
      { headers }
    );
  }

  if (!data.session) {
    return redirect(
      `/auth/email-sent/verify?email=${encodeURIComponent(email)}`,
      { headers }
    );
  }

  return redirect("/hub", { headers });
}
