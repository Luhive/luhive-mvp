export { action } from "~/modules/dashboard/server/notification-settings-action.server";
export { loader } from "~/modules/dashboard/server/notification-settings-loader.server";
export { meta } from "~/modules/dashboard/model/settings-meta";

import { useLoaderData } from "react-router";
import { NotificationSettings } from "~/modules/dashboard/components/notification-settings";
import type { NotificationSettingsLoaderData } from "~/modules/dashboard/model/dashboard-types";

export default function DashboardSettings() {
  const { notifyRegistrations } =
    useLoaderData<NotificationSettingsLoaderData>();

  return (
    <div className="py-4 px-4 md:px-6">
      <NotificationSettings notifyRegistrations={notifyRegistrations} />
    </div>
  );
}
