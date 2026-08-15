import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { getNotifyRegistrations } from "~/modules/dashboard/data/notification-settings-repo.server";
import type { NotificationSettingsLoaderData } from "~/modules/dashboard/model/dashboard-types";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string | undefined>;
}): Promise<NotificationSettingsLoaderData> {
  const slug = params.slug;
  if (!slug) {
    return { notifyRegistrations: true };
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifyRegistrations: true };
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!community) {
    return { notifyRegistrations: true };
  }

  const serviceClient = createServiceRoleClient();
  const { notifyRegistrations } = await getNotifyRegistrations(
    serviceClient,
    community.id,
    user.id,
  );

  return { notifyRegistrations };
}
