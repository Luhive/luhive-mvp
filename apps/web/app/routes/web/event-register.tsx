export { action } from "~/modules/events/server/event-detail-action.server";
export { loader } from "~/modules/events/server/event-register-loader.server";
export { meta } from "~/modules/events/model/event-register-meta";

import { useEffect } from "react";
import { useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import type { EventDetailLoaderData } from "~/modules/events/server/event-detail-loader.server";
import type { EventRegisterInviteLoaderData } from "~/modules/events/server/event-register-loader.server";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";
import { EventRegisterView } from "~/modules/events/components/event-register/event-register-view";
import { useEventRegistrationQuery } from "~/modules/events/hooks/use-event-registration-query";

export default function EventRegisterPage() {
  const parent = useRouteLoaderData("routes/web/event-detail") as
    | EventDetailLoaderData
    | undefined;
  const inviteData = useLoaderData<EventRegisterInviteLoaderData | null>();

  if (!parent) return null;

  return <EventRegisterContent parent={parent} inviteData={inviteData} />;
}

function EventRegisterContent({
  parent,
  inviteData,
}: {
  parent: EventDetailLoaderData;
  inviteData: EventRegisterInviteLoaderData | null;
}) {
  const navigate = useNavigate();
  const {
    event,
    community,
    userData,
    hasCustomQuestions,
    userPhone,
    isExternalEvent,
  } = parent;
  const eventPageUrl = Routes.community.event(
    community.slug,
    publicEventSlug(event),
  );
  const registrationQuery = useEventRegistrationQuery(event.id, community.id);
  const resolvedUserData = {
    ...userData,
    ...(registrationQuery.data ?? {
      isUserRegistered: userData.isUserRegistered,
      userRegistrationStatus: userData.userRegistrationStatus,
      userCheckinToken: userData.userCheckinToken,
      registrationCount: userData.registrationCount,
      user: userData.user,
      userProfile: userData.userProfile,
      isCommunityMember: userData.isCommunityMember,
      canRegister: userData.canRegister,
    }),
  };

  const isInviteMode = Boolean(
    inviteData?.inviteToken && resolvedUserData.user && hasCustomQuestions,
  );

  const isEligible =
    isInviteMode ||
    (!isExternalEvent &&
      !resolvedUserData.isOwnerOrAdmin &&
      !resolvedUserData.isUserRegistered &&
      resolvedUserData.canRegister &&
      !(resolvedUserData.user && !hasCustomQuestions));

  useEffect(() => {
    if (isEligible) return;
    const target = resolvedUserData.isUserRegistered
      ? `${eventPageUrl}${eventPageUrl.includes("?") ? "&" : "?"}registered=1`
      : eventPageUrl;
    navigate(target, { replace: true });
  }, [eventPageUrl, isEligible, navigate, resolvedUserData.isUserRegistered]);

  if (!isEligible) {
    return null;
  }

  return (
    <EventRegisterView
      event={event}
      community={community}
      hasCustomQuestions={hasCustomQuestions}
      customQuestions={event.custom_questions as never}
      userPhone={userPhone}
      user={resolvedUserData.user}
      userProfile={resolvedUserData.userProfile}
      inviteData={inviteData}
    />
  );
}
