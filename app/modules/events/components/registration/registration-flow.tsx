"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Routes } from "~/shared/lib/routing/routes";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Spinner } from "~/shared/components/ui/spinner";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { OtpInputInline } from "~/modules/auth/components/otp-input-inline";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import { JoinCommunityCheckbox } from "~/modules/events/components/registration/join-community-checkbox";
import type { CustomQuestionJson } from "~/modules/events/model/event.types";
import type { CustomAnswerJson } from "~/modules/events/model/event.types";
import {
  getEventTrackingContext,
  type EventTrackingContext,
} from "~/modules/events/utils/event-session-tracker";
import { cn } from "~/shared/lib/utils/cn";
import { createClient } from "~/shared/lib/supabase/client";
import type { OtpVerifySuccessResult } from "~/modules/auth/model/otp.types";

const OVERLAY_FIELD_CLASS =
  "bg-muted/50 border-transparent shadow-none h-11 rounded-lg focus-visible:bg-background";

type EmailFormValues = { email: string };
type DetailsFormValues = { fullName: string };

export type RegistrationFlowStep = "email" | "details" | "questions" | "otp";

type CheckEmailFetcherData = {
  success?: boolean;
  userExists?: boolean;
  email?: string;
  error?: string;
};

type SignupFetcherData = {
  success?: boolean;
  otpSent?: boolean;
  email?: string;
  error?: string;
};

export interface RegistrationFlowProps {
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
  registerActionUrl?: string;
  onSuccess: (result?: OtpVerifySuccessResult) => void;
  onOtpVerified?: (result: OtpVerifySuccessResult) => void;
  showStepHeader?: boolean;
  onStepChange?: (step: RegistrationFlowStep) => void;
  variant?: "default" | "overlay";
  isCommunityMember?: boolean;
}

export function getRegistrationStepLabels(step: RegistrationFlowStep) {
  const title =
    step === "otp"
      ? "Verify your email"
      : step === "details"
        ? "Your details"
        : step === "questions"
          ? "Complete your registration"
          : "Register for event";

  const description =
    step === "email"
      ? "Enter your email to get started."
      : step === "otp"
        ? null
        : step === "questions"
          ? "Please answer the following questions."
          : "Enter your name to continue.";

  return { title, description };
}

export function getRegistrationOverlayTitle(step: RegistrationFlowStep) {
  if (step === "otp") return "Verify your email";
  if (step === "email") return "Register";
  return "Your Info";
}

export function RegistrationFlow({
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
  registerActionUrl,
  onSuccess,
  onOtpVerified,
  showStepHeader = false,
  onStepChange,
  variant = "default",
  isCommunityMember: isCommunityMemberProp,
}: RegistrationFlowProps) {
  const isOverlay = variant === "overlay";
  const checkEmailFetcher = useFetcher<CheckEmailFetcherData>();
  const signupFetcher = useFetcher<SignupFetcherData>();
  const questionsFetcher = useFetcher();

  const [step, setStep] = React.useState<RegistrationFlowStep>("email");
  const [userExists, setUserExists] = React.useState<boolean | null>(null);
  const [otpEmail, setOtpEmail] = React.useState("");
  const [emailStepError, setEmailStepError] = React.useState<string | null>(null);
  const [detailsStepError, setDetailsStepError] = React.useState<string | null>(null);
  const [joinCommunity, setJoinCommunity] = React.useState(true);
  const [customAnswers, setCustomAnswers] = React.useState<CustomAnswerJson | null>(null);
  const [existingUserFullName, setExistingUserFullName] = React.useState<string | null>(null);
  const [existingUserAvatarUrl, setExistingUserAvatarUrl] = React.useState<string | null>(null);
  const [resolvedIsCommunityMember, setResolvedIsCommunityMember] = React.useState<
    boolean | null
  >(isCommunityMemberProp !== undefined ? isCommunityMemberProp : null);

  const emailForm = useForm<EmailFormValues>({
    defaultValues: { email: "" },
  });
  const detailsForm = useForm<DetailsFormValues>({
    defaultValues: { fullName: "" },
  });

  const isCheckingEmail =
    checkEmailFetcher.state === "submitting" || checkEmailFetcher.state === "loading";
  const isSubmittingSignup =
    signupFetcher.state === "submitting" || signupFetcher.state === "loading";
  const isSubmittingQuestions =
    questionsFetcher.state === "submitting" || questionsFetcher.state === "loading";

  const eventPageUrl = Routes.community.event(communitySlug, eventSlug);
  const resolvedRegisterActionUrl = registerActionUrl ?? eventPageUrl;
  const resolvedTrackingContext = React.useMemo(
    () => trackingContext ?? getEventTrackingContext(eventId),
    [eventId, trackingContext],
  );

  React.useEffect(() => {
    if (isCommunityMemberProp !== undefined) {
      setResolvedIsCommunityMember(isCommunityMemberProp);
      if (isCommunityMemberProp) {
        setJoinCommunity(false);
      }
    }
  }, [isCommunityMemberProp]);

  React.useEffect(() => {
    if (isCommunityMemberProp !== undefined) return;
    if (userExists !== true || step !== "questions") return;

    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data: membership } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const isMember = !!membership;
      setResolvedIsCommunityMember(isMember);
      if (isMember) {
        setJoinCommunity(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [communityId, isCommunityMemberProp, step, userExists]);

  const isCheckingExistingMembership =
    isCommunityMemberProp === undefined &&
    userExists === true &&
    step === "questions" &&
    resolvedIsCommunityMember === null;

  const shouldShowJoinCommunityCheckbox =
    !isCheckingExistingMembership && resolvedIsCommunityMember !== true;

  React.useEffect(() => {
    const data = checkEmailFetcher.data;
    if (!data || checkEmailFetcher.state !== "idle") return;

    if (data.userExists) {
      setUserExists(true);
      setOtpEmail((data.email || emailForm.getValues("email") || "").trim());
      setStep("otp");
      return;
    }
    if (data.success && !data.userExists) {
      setUserExists(false);
      setStep("details");
      return;
    }
    if (data.error) {
      setEmailStepError(data.error);
    }
  }, [checkEmailFetcher.data, checkEmailFetcher.state, emailForm]);

  React.useEffect(() => {
    const data = signupFetcher.data;
    if (!data || signupFetcher.state !== "idle") return;

    if (data.success && data.otpSent) {
      const email = (data.email || emailForm.getValues("email") || "").trim();
      setOtpEmail(email);
      setStep("otp");
      return;
    }
    if (data.error) {
      toast.error(data.error);
    }
  }, [signupFetcher.data, signupFetcher.state, emailForm]);

  React.useEffect(() => {
    const data = questionsFetcher.data as { success?: boolean; error?: string } | undefined;
    if (!data || questionsFetcher.state !== "idle") return;

    if (data.success) {
      toast.success("Successfully registered for the event!");
      onSuccess();
    } else if (data.error) {
      toast.error(data.error);
    }
  }, [questionsFetcher.data, questionsFetcher.state, onSuccess]);

  const handleContinueWithEmail = () => {
    const rawEmail = emailForm.getValues("email");
    const trimmedEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEmailStepError("Please enter a valid email address.");
      return;
    }
    setEmailStepError(null);
    emailForm.setValue("email", trimmedEmail, { shouldValidate: true });

    const formData = new FormData();
    formData.append("intent", "check-email");
    formData.append("_modal", "true");
    formData.append("email", trimmedEmail);
    checkEmailFetcher.submit(formData, { method: "post", action: "/signup" });
  };

  const validateFullName = (): string | null => {
    const fullName = detailsForm.getValues("fullName")?.trim() || "";
    if (!fullName || fullName.length < 2) {
      return "Please enter your full name.";
    }
    detailsForm.setValue("fullName", fullName);
    return null;
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateFullName();
    if (validationError) {
      setDetailsStepError(validationError);
      return;
    }
    setDetailsStepError(null);

    const fullName = detailsForm.getValues("fullName").trim();
    const email = emailForm.getValues("email")?.trim() || "";

    if (hasCustomQuestions) {
      setStep("questions");
      return;
    }

    const formData = new FormData();
    formData.append("intent", "event-rsvp-signup");
    formData.append("_modal", "true");
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("eventId", eventId);
    formData.append("communityId", communityId);
    formData.append("joinCommunity", joinCommunity ? "true" : "false");
    signupFetcher.submit(formData, { method: "post", action: "/signup" });
  };

  const handleQuestionsSubmitFromDetails = (answers: CustomAnswerJson) => {
    setCustomAnswers(answers);
    const fullName = detailsForm.getValues("fullName").trim();
    const email = emailForm.getValues("email")?.trim() || "";
    const formData = new FormData();
    formData.append("intent", "event-rsvp-signup");
    formData.append("_modal", "true");
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("eventId", eventId);
    formData.append("communityId", communityId);
    formData.append("joinCommunity", joinCommunity ? "true" : "false");
    signupFetcher.submit(formData, { method: "post", action: "/signup" });
  };

  const handleQuestionsSubmitFromExisting = (answers: CustomAnswerJson) => {
    const formData = new FormData();
    formData.append("intent", "register");
    formData.append("custom_answers", JSON.stringify(answers));
    formData.append("joinCommunity", joinCommunity ? "true" : "false");
    questionsFetcher.submit(formData, {
      method: "post",
      action: resolvedRegisterActionUrl,
    });
  };

  const handleOtpSuccessExistingUser = (result: OtpVerifySuccessResult) => {
    if (result.fullName) setExistingUserFullName(result.fullName);
    setExistingUserAvatarUrl(result.avatarUrl ?? null);
    onOtpVerified?.(result);

    if (result.registrationState?.isUserRegistered) {
      onSuccess(result);
      return;
    }

    if (hasCustomQuestions) {
      setStep("questions");
    } else {
      toast.success("Successfully registered for the event!");
      onSuccess(result);
    }
  };

  const handleOtpSuccessNewUser = (result: OtpVerifySuccessResult) => {
    toast.success("Successfully registered for the event!");
    onSuccess(result);
  };

  const emailStepContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="rsvp-email">Email</Label>
        <Input
          id="rsvp-email"
          type="email"
          placeholder="you@example.com"
          {...emailForm.register("email")}
          disabled={isCheckingEmail}
          className={isOverlay ? OVERLAY_FIELD_CLASS : undefined}
        />
      </div>
      {emailStepError && (
        <p className="text-sm text-destructive">{emailStepError}</p>
      )}
      <Button
        type="button"
        onClick={handleContinueWithEmail}
        disabled={isCheckingEmail}
        className="w-full"
        size={isOverlay ? "lg" : "default"}
      >
        {isCheckingEmail ? <Spinner /> : "Continue"}
      </Button>
    </div>
  );

  const joinCommunityCheckbox = shouldShowJoinCommunityCheckbox ? (
    <JoinCommunityCheckbox
      id="join-community"
      communityName={communityName}
      checked={joinCommunity}
      onCheckedChange={setJoinCommunity}
      disabled={isSubmittingSignup || isSubmittingQuestions}
    />
  ) : null;

  const detailsStepContent = (
    <form onSubmit={handleDetailsSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="rsvp-full-name">Full Name</Label>
        <Input
          id="rsvp-full-name"
          placeholder="John Doe"
          {...detailsForm.register("fullName")}
          disabled={isSubmittingSignup}
          className={isOverlay ? OVERLAY_FIELD_CLASS : undefined}
        />
      </div>
      {detailsStepError && (
        <p className="text-sm text-destructive">{detailsStepError}</p>
      )}
      {!hasCustomQuestions ? joinCommunityCheckbox : null}
      {hasCustomQuestions ? (
        <Button
          type="button"
          onClick={() => {
            const validationError = validateFullName();
            if (validationError) {
              setDetailsStepError(validationError);
              return;
            }
            setDetailsStepError(null);
            setStep("questions");
          }}
          disabled={isSubmittingSignup}
          className="w-full"
          size={isOverlay ? "lg" : "default"}
        >
          Continue
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isSubmittingSignup}
          className="w-full"
          size={isOverlay ? "lg" : "default"}
        >
          {isSubmittingSignup ? <Spinner /> : "Continue to Verify"}
        </Button>
      )}
    </form>
  );

  const questionsStepContent =
    hasCustomQuestions &&
    (userExists ? (
      <CustomQuestionsForm
        open={step === "questions"}
        onOpenChange={() => {}}
        eventId={eventId}
        customQuestions={customQuestions}
        userName={existingUserFullName ?? otpEmail?.split("@")[0] ?? undefined}
        userEmail={otpEmail}
        userAvatarUrl={existingUserAvatarUrl ?? undefined}
        userPhone={userPhone ?? undefined}
        onSubmit={handleQuestionsSubmitFromExisting}
        isSubmitting={isSubmittingQuestions}
        inline={!isOverlay}
        variant={isOverlay ? "overlay" : "default"}
        afterQuestionsContent={joinCommunityCheckbox}
      />
    ) : (
      <CustomQuestionsForm
        open={step === "questions"}
        onOpenChange={() => {}}
        eventId={eventId}
        customQuestions={customQuestions}
        userName={detailsForm.getValues("fullName")?.trim() || undefined}
        userEmail={emailForm.getValues("email")?.trim()}
        userPhone={userPhone ?? undefined}
        onSubmit={(answers) => handleQuestionsSubmitFromDetails(answers)}
        isSubmitting={isSubmittingSignup}
        inline={!isOverlay}
        variant={isOverlay ? "overlay" : "default"}
        afterQuestionsContent={joinCommunityCheckbox}
      />
    ));

  const otpStepContent = (
    <div className="space-y-4">
      <OtpInputInline
        email={otpEmail}
        communityId={joinCommunity ? communityId : undefined}
        returnTo={returnTo ?? undefined}
        onSuccess={userExists ? handleOtpSuccessExistingUser : handleOtpSuccessNewUser}
        fullName={
          !userExists ? detailsForm.getValues("fullName")?.trim() || undefined : undefined
        }
        eventId={eventId}
        customAnswers={customAnswers ? JSON.stringify(customAnswers) : undefined}
        eventSessionId={resolvedTrackingContext.sessionId}
        eventUtmSource={resolvedTrackingContext.utmSource}
        eventUtmMedium={resolvedTrackingContext.utmMedium}
        eventUtmCampaign={resolvedTrackingContext.utmCampaign}
        eventUtmContent={resolvedTrackingContext.utmContent}
        eventUtmTerm={resolvedTrackingContext.utmTerm}
        eventFirstVisitStartedAt={resolvedTrackingContext.firstVisitStartedAt}
        joinCommunity={joinCommunity}
      />
    </div>
  );

  const stepContent =
    step === "email"
      ? emailStepContent
      : step === "details"
        ? detailsStepContent
        : step === "questions"
          ? questionsStepContent
          : otpStepContent;

  const { title, description } = getRegistrationStepLabels(step);

  React.useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  return (
    <div className={cn(isOverlay ? undefined : "space-y-6")}>
      {showStepHeader && !isOverlay && step !== "questions" && (
        <div className="space-y-1">
          <h2
            className={`text-xl font-semibold ${step === "otp" ? "text-center" : ""}`}
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {step === "questions" ? questionsStepContent : stepContent}
    </div>
  );
}
