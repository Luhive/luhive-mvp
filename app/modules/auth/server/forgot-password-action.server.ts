import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return Response.json(
      { success: false, error: "Email is required" },
      { headers }
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { headers }
    );
  }

  return redirect(
    `/auth/email-sent/reset?email=${encodeURIComponent(email)}`,
    { headers }
  );
}
