export { loader } from "~/modules/profile/server/profile-loader.server";
export { meta } from "~/modules/profile/model/profile-meta";

import { useLoaderData } from "react-router";
import { TabBarSimple } from "~/shared/components/tab-bar-simple";
import { ProfileHeader } from "~/modules/profile/components/profile-header";
import { ProfileCommunitiesTab } from "~/modules/profile/components/profile-communities-tab";
import { ProfileEventsTab } from "~/modules/profile/components/profile-events-tab";
import type { ProfileLoaderData } from "~/modules/profile/models/profile.types";

export default function ProfilePage() {
  const { user, communities, events } = useLoaderData<ProfileLoaderData>();

  if (!user) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <ProfileHeader user={user} />

      <TabBarSimple
        defaultValue="communities"
        tabs={[
          {
            name: "Communities",
            value: "communities",
            content: <ProfileCommunitiesTab communities={communities} />,
          },
          {
            name: "Events",
            value: "events",
            content: <ProfileEventsTab events={events} />,
          },
        ]}
      />
    </div>
  );
}
