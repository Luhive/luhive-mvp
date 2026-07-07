import { useMemo, useRef, useState } from "react";
import { useNavigate, useNavigation, useSubmit } from "react-router";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";
import { RegistrationOverlayShell } from "~/modules/events/components/event-register/registration-overlay-shell";
import {
  RegistrationFlow,
  getRegistrationOverlayTitle,
  type RegistrationFlowStep,
} from "~/modules/events/components/registration/registration-flow";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import { useEventDetailToasts } from "~/modules/events/hooks/use-event-detail-toasts";
import { getEventTrackingContext } from "~/modules/events/utils/event-session-tracker";
import type { Community, Event, Profile } from "~/shared/models/entity.types";
import type { CustomQuestionJson } from "~/modules/events/model/event.types";
import type { EventRegisterInviteLoaderData } from "~/modules/events/server/event-register-loader.server";
import {
  useInvalidateEventRegistrationQuery,
  useRegistrationCacheUpdate,
} from "~/modules/events/hooks/use-event-registration-query";
import { useSetCurrentUserCache } from "~/shared/hooks/use-current-user-query";
import type { OtpVerifySuccessResult } from "~/modules/auth/model/otp.types";

interface EventRegisterViewProps {
  event: Event;
  community: Community;
  hasCustomQuestions: boolean;
  customQuestions: CustomQuestionJson | null;
  userPhone: string | null;
  user: { id: string; email?: string | null } | null;
  userProfile: Profile | null;
  inviteData?: EventRegisterInviteLoaderData | null;
}

export function EventRegisterView({
  event,
  community,
  hasCustomQuestions,
  customQuestions,
  userPhone,
  user,
  userProfile,
  inviteData,
}: EventRegisterViewProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const updateEventPageCache = useRegistrationCacheUpdate(event.id);
  const invalidateEventRegistration = useInvalidateEventRegistrationQuery(event.id);
  const setCurrentUserCache = useSetCurrentUserCache();
  const lastSubmittedIntentRef = useRef<string | null>(null);
  const [guestStep, setGuestStep] = useState<RegistrationFlowStep>("email");

  const isInviteMode = Boolean(inviteData?.inviteToken);

  const eventSlug = publicEventSlug(event);
  const eventPageUrl = Routes.community.event(community.slug, eventSlug);
  const registerPageUrl = Routes.community.eventRegister(
    community.slug,
    eventSlug,
  );
  const trackingContext = useMemo(
    () => getEventTrackingContext(event.id),
    [event.id],
  );

  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  const navigateAfterRegistration = () => {
    const separator = eventPageUrl.includes("?") ? "&" : "?";
    navigate(`${eventPageUrl}${separator}registered=1`, { replace: true });
  };

  // Logged-in POST flows: the toasts hook applies the server-returned state.
  useEventDetailToasts({
    eventId: event.id,
    submittedIntentRef: lastSubmittedIntentRef,
    onRegisterSuccess: navigateAfterRegistration,
  });

  // Guest/OTP flows register outside this route's action, so flip the UI
  // from what we know; the cache update refetches the rest (count, token).
  const handleOtpVerified = (result: OtpVerifySuccessResult) => {
    if (result.userProfile) {
      setCurrentUserCache(result.userProfile);
    }
    if (result.registrationState) {
      updateEventPageCache(result.registrationState);
    } else {
      invalidateEventRegistration();
    }
  };

  const handleRegistrationSuccess = (result?: OtpVerifySuccessResult) => {
    if (result?.userProfile) {
      setCurrentUserCache(result.userProfile);
    }

    if (result?.registrationState) {
      updateEventPageCache(result.registrationState);
    } else {
      updateEventPageCache({
        isUserRegistered: true,
        userRegistrationStatus: event.is_approve_required
          ? "pending"
          : "approved",
      });
    }

    navigateAfterRegistration();
  };

  const handleCustomQuestionsSubmit = (answers: Record<string, unknown>) => {
    lastSubmittedIntentRef.current = isInviteMode
      ? "accept-invite"
      : "register";

    const formData = new FormData();
    formData.append("intent", isInviteMode ? "accept-invite" : "register");
    formData.append("custom_answers", JSON.stringify(answers));

    if (isInviteMode && inviteData?.inviteToken) {
      formData.append("inviteToken", inviteData.inviteToken);
    } else {
      formData.append("eventSessionId", trackingContext.sessionId);
      formData.append("eventUtmSource", trackingContext.utmSource);
      if (trackingContext.utmMedium)
        formData.append("eventUtmMedium", trackingContext.utmMedium);
      if (trackingContext.utmCampaign) {
        formData.append("eventUtmCampaign", trackingContext.utmCampaign);
      }
      if (trackingContext.utmContent) {
        formData.append("eventUtmContent", trackingContext.utmContent);
      }
      if (trackingContext.utmTerm)
        formData.append("eventUtmTerm", trackingContext.utmTerm);
      formData.append(
        "eventFirstVisitStartedAt",
        trackingContext.firstVisitStartedAt,
      );
    }

    submit(formData, { method: "POST" });
  };

  const overlayTitle = isInviteMode
    ? "Complete your registration"
    : user && hasCustomQuestions
      ? "Tell us more"
      : getRegistrationOverlayTitle(guestStep);

  const inviteDisplayName =
    inviteData?.inviteeName || userProfile?.full_name || undefined;
  const inviteDisplayEmail =
    inviteData?.inviteeEmail || user?.email || undefined;
  return (
    <RegistrationOverlayShell title={overlayTitle} onCloseHref={eventPageUrl}>
      {(user && hasCustomQuestions) || isInviteMode ? (
        <CustomQuestionsForm
          open
          onOpenChange={() => {}}
          eventId={event.id}
          customQuestions={customQuestions}
          userName={inviteDisplayName}
          userEmail={inviteDisplayEmail}
          userAvatarUrl={userProfile?.avatar_url || undefined}
          userPhone={userPhone ?? undefined}
          onSubmit={handleCustomQuestionsSubmit}
          isSubmitting={isSubmitting}
          variant="overlay"
        />
      ) : (
        <RegistrationFlow
          eventId={event.id}
          eventSlug={eventSlug}
          communitySlug={community.slug}
          communityId={community.id}
          communityName={community.name}
          hasCustomQuestions={hasCustomQuestions}
          customQuestions={customQuestions}
          userPhone={userPhone}
          returnTo={registerPageUrl}
          trackingContext={trackingContext}
          registerActionUrl={registerPageUrl}
          onSuccess={handleRegistrationSuccess}
          onOtpVerified={handleOtpVerified}
          onStepChange={setGuestStep}
          variant="overlay"
        />
      )}
    </RegistrationOverlayShell>
  );
}
