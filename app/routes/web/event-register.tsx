export { action } from "~/modules/events/server/event-detail-action.server";
export { meta } from "~/modules/events/model/event-register-meta";

import { Navigate, useRouteLoaderData } from "react-router";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";
import { EventRegisterView } from "~/modules/events/components/event-register/event-register-view";

export default function EventRegisterPage() {
  const parent = useRouteLoaderData(
    "routes/web/event-detail",
  ) as EventDetailLoaderData | undefined;

  if (!parent) return null;

  const { event, community, userData, hasCustomQuestions, userPhone, isExternalEvent } =
    parent;
  const eventPageUrl = Routes.community.event(community.slug, publicEventSlug(event));

  const isEligible =
    !isExternalEvent &&
    !userData.isOwnerOrAdmin &&
    !userData.isUserRegistered &&
    userData.canRegister &&
    !(userData.user && !hasCustomQuestions);

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
    />
  );
}
