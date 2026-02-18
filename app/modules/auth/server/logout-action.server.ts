import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import { clearUser } from "~/shared/lib/monitoring/sentry";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  clearUser();

  return redirect("/hub", { headers });
}
