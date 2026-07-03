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

interface EventRegisterViewProps {
  event: Event;
  community: Community;
  hasCustomQuestions: boolean;
  customQuestions: CustomQuestionJson | null;
  userPhone: string | null;
  user: { id: string; email?: string | null } | null;
  userProfile: Profile | null;
}

export function EventRegisterView({
  event,
  community,
  hasCustomQuestions,
  customQuestions,
  userPhone,
  user,
  userProfile,
}: EventRegisterViewProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const lastSubmittedIntentRef = useRef<string | null>(null);
  const [guestStep, setGuestStep] = useState<RegistrationFlowStep>("email");

  const eventSlug = publicEventSlug(event);
  const eventPageUrl = Routes.community.event(community.slug, eventSlug);
  const registerPageUrl = Routes.community.eventRegister(community.slug, eventSlug);
  const trackingContext = useMemo(() => getEventTrackingContext(event.id), [event.id]);

  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

  const navigateAfterRegistration = () => {
    navigate(eventPageUrl, { replace: true, state: { justRegistered: true } });
  };

  useEventDetailToasts({
    submittedIntentRef: lastSubmittedIntentRef,
    onRegisterSuccess: navigateAfterRegistration,
  });

  const handleRegistrationSuccess = navigateAfterRegistration;

  const handleCustomQuestionsSubmit = (answers: Record<string, unknown>) => {
    lastSubmittedIntentRef.current = "register";

    const formData = new FormData();
    formData.append("intent", "register");
    formData.append("custom_answers", JSON.stringify(answers));
    formData.append("eventSessionId", trackingContext.sessionId);
    formData.append("eventUtmSource", trackingContext.utmSource);
    if (trackingContext.utmMedium) formData.append("eventUtmMedium", trackingContext.utmMedium);
    if (trackingContext.utmCampaign) {
      formData.append("eventUtmCampaign", trackingContext.utmCampaign);
    }
    if (trackingContext.utmContent) {
      formData.append("eventUtmContent", trackingContext.utmContent);
    }
    if (trackingContext.utmTerm) formData.append("eventUtmTerm", trackingContext.utmTerm);
    formData.append("eventFirstVisitStartedAt", trackingContext.firstVisitStartedAt);
    submit(formData, { method: "POST" });
  };

  const overlayTitle =
    user && hasCustomQuestions
      ? "Tell us more"
      : getRegistrationOverlayTitle(guestStep);

  return (
    <RegistrationOverlayShell title={overlayTitle} onCloseHref={eventPageUrl}>
      {user && hasCustomQuestions ? (
        <CustomQuestionsForm
          open
          onOpenChange={() => {}}
          eventId={event.id}
          customQuestions={customQuestions}
          userName={userProfile?.full_name || undefined}
          userEmail={user.email || undefined}
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
          onStepChange={setGuestStep}
          variant="overlay"
        />
      )}
    </RegistrationOverlayShell>
  );
}
