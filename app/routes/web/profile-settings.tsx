export { loader } from "~/modules/profile/server/settings-loader.server";
export { action } from "~/modules/profile/server/settings-action.server";

import { useLoaderData } from "react-router";
import { ProfileAvatarUpload } from "~/modules/profile/components/profile-avatar-upload";
import { SettingsForm } from "~/modules/profile/components/settings-form";
import type { SettingsLoaderData } from "~/modules/profile/models/settings.types";

export default function ProfileSettingsPage() {
  const { user, email } = useLoaderData<SettingsLoaderData>();

  if (!user) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        Please log in to view your settings.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <ProfileAvatarUpload
          userId={user.id}
          currentAvatarUrl={user.avatar_url}
          userName={user.full_name}
        />
        <SettingsForm user={user} email={email} />
      </div>
    </div>
  );
}
