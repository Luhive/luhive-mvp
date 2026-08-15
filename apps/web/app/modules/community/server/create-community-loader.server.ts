import { createClient } from "~/shared/lib/supabase/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export type CreateCommunityLoaderData = {
  user: { id: string };
};

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<CreateCommunityLoaderData | Response> {
  const { supabase } = createClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/signup?redirect=/create-community");
  }

  return {
    user: { id: user.id },
  };
}
