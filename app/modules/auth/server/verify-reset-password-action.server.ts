import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { resetPasswordSchema } from "~/modules/auth/model/auth-schema";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const data = {
    password: (formData.get("password") as string)?.trim() || "",
    confirmPassword: (formData.get("confirmPassword") as string)?.trim() || "",
  };

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return Response.json(
      {
        success: false,
        error:
          "Your session has expired. Please request a new reset link.",
      },
      { headers }
    );
  }

  const result = resetPasswordSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      { success: false, error: firstError.message },
      { headers }
    );
  }

  const { password } = result.data;

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    let errorMessage = updateError.message;
    if (
      updateError.message.includes("same") ||
      updateError.message.includes("current password")
    ) {
      errorMessage =
        "New password must be different from your current password.";
    } else if (
      updateError.message.includes("weak") ||
      updateError.message.includes("strength")
    ) {
      errorMessage = "Password is too weak. Please use a stronger password.";
    }
    return Response.json({ success: false, error: errorMessage });
  }

  await supabase.auth.signOut();

  return redirect("/login?reset=success", { headers });
}
