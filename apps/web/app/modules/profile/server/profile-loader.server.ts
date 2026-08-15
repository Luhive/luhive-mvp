import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import type { Database } from "~/shared/models/database.types";
import { Profile } from "~/shared/models/entity.types";


export type ProfileLoaderData = {
  user: Profile | null;
  email: string | null;
};

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<ProfileLoaderData> {
  const { supabase } = createClient(request);

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null, email: null };
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
