import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import type { SettingsLoaderData } from "~/modules/profile/models/settings.types";

export type { SettingsLoaderData };

export async function loader({ request }: LoaderFunctionArgs): Promise<SettingsLoaderData> {
  const { supabase } = createClient(request);

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return {
    user: profile || null,
    email: authUser.email || null,
  };
}
