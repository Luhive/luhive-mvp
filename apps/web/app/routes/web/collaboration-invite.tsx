export { loader } from "~/modules/events/server/collaboration-invite-loader.server";
export { action } from "~/modules/events/server/collaboration-invite-action.server";

import { useActionData, useLoaderData, useNavigation } from "react-router";
import { CollaborationInviteView } from "~/modules/events/components/collaboration/collaboration-invite-view";
import type {
  CollaborationInviteActionData,
  CollaborationInviteLoaderData,
} from "~/modules/events/model/collaboration-invite.types";

export default function CollaborationInvitePage() {
  const loaderData = useLoaderData<CollaborationInviteLoaderData>();
  const actionData = useActionData<CollaborationInviteActionData>();
  const navigation = useNavigation();

  const { event, coHostCommunity, hostCommunity, status } = loaderData;
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent = navigation.formData?.get("intent")?.toString() ?? null;

  return (
    <CollaborationInviteView
      event={event}
      coHostCommunity={coHostCommunity}
      hostCommunity={hostCommunity}
      status={status}
      actionData={actionData}
      isSubmitting={isSubmitting}
      submittingIntent={submittingIntent}
    />
  );
}
