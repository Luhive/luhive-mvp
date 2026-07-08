"use client";

import * as React from "react";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { Routes } from "~/shared/lib/routing/routes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import { FullscreenModal } from "~/shared/components/ui/fullscreen-modal";
import { useNavigate } from "react-router";
import {
  RegistrationFlow,
  getRegistrationStepLabels,
  type RegistrationFlowStep,
} from "~/modules/events/components/registration/registration-flow";
import type { CustomQuestionJson } from "~/modules/events/model/event.types";
import type { EventTrackingContext } from "~/modules/events/utils/event-session-tracker";

export interface EventRsvpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventSlug: string;
  communitySlug: string;
  communityId: string;
  communityName: string;
  hasCustomQuestions: boolean;
  customQuestions: CustomQuestionJson | null;
  userPhone?: string | null;
  returnTo?: string;
  trackingContext?: EventTrackingContext;
}

export function EventRsvpModal({
  open,
  onOpenChange,
  eventId,
  eventSlug,
  communitySlug,
  communityId,
  communityName,
  hasCustomQuestions,
  customQuestions,
  userPhone,
  returnTo,
  trackingContext,
}: EventRsvpModalProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<RegistrationFlowStep>("form");
  const flowKey = open ? "open" : "closed";

  const pathname = Routes.community.event(communitySlug, eventSlug);

  const handleSuccess = React.useCallback(() => {
    onOpenChange(false);
    navigate(pathname + (typeof window !== "undefined" ? window.location.search : ""), {
      replace: true,
    });
  }, [navigate, onOpenChange, pathname]);

  React.useEffect(() => {
    if (open) return;
    setStep("form");
  }, [open]);

  const { title, description } = getRegistrationStepLabels(step);

  const flow = (
    <RegistrationFlow
      key={flowKey}
      eventId={eventId}
      eventSlug={eventSlug}
      communitySlug={communitySlug}
      communityId={communityId}
      communityName={communityName}
      hasCustomQuestions={hasCustomQuestions}
      customQuestions={customQuestions}
      userPhone={userPhone}
      returnTo={returnTo}
      trackingContext={trackingContext}
      onSuccess={handleSuccess}
      onStepChange={setStep}
    />
  );

  if (isMobile) {
    return (
      <FullscreenModal open={open} onOpenChange={onOpenChange} title={title}>
        {flow}
      </FullscreenModal>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className={step === "otp" ? "text-center sm:text-center" : undefined}>
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{flow}</div>
      </DialogContent>
    </Dialog>
  );
}
