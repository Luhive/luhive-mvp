export { action } from "~/modules/events/server/event-detail-action.server";
export { loader } from "~/modules/events/server/event-register-loader.server";
export { meta } from "~/modules/events/model/event-register-meta";

import { Navigate, useLoaderData, useRouteLoaderData } from "react-router";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import type { EventRegisterInviteLoaderData } from "~/modules/events/server/event-register-loader.server";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";
import { EventRegisterView } from "~/modules/events/components/event-register/event-register-view";

export default function EventRegisterPage() {
  const parent = useRouteLoaderData(
    "routes/web/event-detail",
  ) as EventDetailLoaderData | undefined;
  const inviteData = useLoaderData<EventRegisterInviteLoaderData | null>();

  if (!parent) return null;

  const { event, community, userData, hasCustomQuestions, userPhone, isExternalEvent } =
    parent;
  const eventPageUrl = Routes.community.event(community.slug, publicEventSlug(event));

  const isInviteMode = Boolean(
    inviteData?.inviteToken && userData.user && hasCustomQuestions,
  );

  const isEligible =
    isInviteMode ||
    (!isExternalEvent &&
      !userData.isOwnerOrAdmin &&
      !userData.isUserRegistered &&
      userData.canRegister &&
      !(userData.user && !hasCustomQuestions));

  if (!isEligible) {
    return <Navigate to={eventPageUrl} replace />;
  }

  return (
    <EventRegisterView
      event={event}
      community={community}
      hasCustomQuestions={hasCustomQuestions}
      customQuestions={event.custom_questions as never}
      userPhone={userPhone}
      user={userData.user}
      userProfile={userData.userProfile}
      inviteData={inviteData}
      isCommunityMember={userData.isCommunityMember}
    />
  );
}
