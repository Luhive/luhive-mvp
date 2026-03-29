import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import type { ProfileLoaderData } from "~/modules/profile/models/profile.types";
import { getProfileCommunities, getProfileEvents } from "~/modules/profile/data/profile-repo.server";

export type { ProfileLoaderData };

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<ProfileLoaderData> {
  const { supabase } = createClient(request);

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null, communities: [], events: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const [communities, events] = await Promise.all([
    getProfileCommunities(supabase, authUser.id),
    getProfileEvents(supabase, authUser.id),
  ]);

  return {
    user: profile || null,
    communities,
    events,
  };
}
