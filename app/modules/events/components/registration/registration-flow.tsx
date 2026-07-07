"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Routes } from "~/shared/lib/routing/routes";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Spinner } from "~/shared/components/ui/spinner";
import { useFetcher, useNavigation, useSubmit } from "react-router";
import { toast } from "sonner";
import { OtpInputInline } from "~/modules/auth/components/otp-input-inline";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import type { CustomQuestionJson } from "~/modules/events/model/event.types";
import type { CustomAnswerJson } from "~/modules/events/model/event.types";
import {
  getEventTrackingContext,
  type EventTrackingContext,
} from "~/modules/events/utils/event-session-tracker";
import { motion } from "motion/react";
import { cn } from "~/shared/lib/utils/cn";
import type { OtpVerifySuccessResult } from "~/modules/auth/model/otp.types";

const OVERLAY_FIELD_CLASS =
  "bg-muted/50 border-transparent shadow-none h-11 rounded-lg focus-visible:bg-background";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.843 32.658 29.29 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.143-7.656 19.143-20 0-1.341-.147-2.652-.432-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.813C14.297 16.128 18.787 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 15.316 4 7.954 8.924 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.196 0 9.86-1.992 13.38-5.223l-6.173-5.234C29.093 34.484 26.682 35.5 24 35.5c-5.262 0-9.799-3.507-11.397-8.248l-6.52 5.017C8.704 39.043 15.83 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-1.018 2.977-3.279 5.308-6.093 6.443l.001-.001 6.173 5.234C34.84 40.782 43 36 43 24c0-1.341-.147-2.652-.432-3.917z"
      />
    </svg>
  );
}

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
}: RegistrationFlowProps) {
  const isOverlay = variant === "overlay";
  const checkEmailFetcher = useFetcher<CheckEmailFetcherData>();
  const signupFetcher = useFetcher<SignupFetcherData>();
  const questionsFetcher = useFetcher();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [step, setStep] = React.useState<RegistrationFlowStep>("email");
  const [userExists, setUserExists] = React.useState<boolean | null>(null);
  const [otpEmail, setOtpEmail] = React.useState("");
  const [emailStepError, setEmailStepError] = React.useState<string | null>(null);
  const [detailsStepError, setDetailsStepError] = React.useState<string | null>(null);
  const [customAnswers, setCustomAnswers] = React.useState<CustomAnswerJson | null>(null);
  const [existingUserFullName, setExistingUserFullName] = React.useState<string | null>(null);
  const [existingUserAvatarUrl, setExistingUserAvatarUrl] = React.useState<string | null>(null);
  const [showEmailSection, setShowEmailSection] = React.useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  const emailForm = useForm<EmailFormValues>({
    defaultValues: { email: "" },
  });
  const { ref: emailRegisterRef, ...emailRegisterProps } = emailForm.register("email");
  const detailsForm = useForm<DetailsFormValues>({
    defaultValues: { fullName: "" },
  });

  const isCheckingEmail =
    checkEmailFetcher.state === "submitting" || checkEmailFetcher.state === "loading";
  const isSubmittingSignup =
    signupFetcher.state === "submitting" || signupFetcher.state === "loading";
  const isSubmittingQuestions =
    questionsFetcher.state === "submitting" || questionsFetcher.state === "loading";
  const isSubmittingOAuth =
    navigation.formData?.get("intent") === "oauth" &&
    navigation.formData?.get("eventId") === eventId;

  const eventPageUrl = Routes.community.event(communitySlug, eventSlug);
  const resolvedRegisterActionUrl = registerActionUrl ?? eventPageUrl;
  const resolvedTrackingContext = React.useMemo(
    () => trackingContext ?? getEventTrackingContext(eventId),
    [eventId, trackingContext],
  );

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

  const handleContinueWithGoogle = () => {
    const formData = new FormData();
    formData.append("intent", "oauth");
    formData.append("provider", "google");
    formData.append("eventId", eventId);
    formData.append("communityId", communityId);
    if (returnTo) formData.append("returnTo", returnTo);
    formData.append("eventSessionId", resolvedTrackingContext.sessionId);
    formData.append("eventUtmSource", resolvedTrackingContext.utmSource);
    if (resolvedTrackingContext.utmMedium) {
      formData.append("eventUtmMedium", resolvedTrackingContext.utmMedium);
    }
    if (resolvedTrackingContext.utmCampaign) {
      formData.append("eventUtmCampaign", resolvedTrackingContext.utmCampaign);
    }
    if (resolvedTrackingContext.utmContent) {
      formData.append("eventUtmContent", resolvedTrackingContext.utmContent);
    }
    if (resolvedTrackingContext.utmTerm) {
      formData.append("eventUtmTerm", resolvedTrackingContext.utmTerm);
    }
    formData.append(
      "eventFirstVisitStartedAt",
      resolvedTrackingContext.firstVisitStartedAt,
    );

    submit(formData, { method: "post", action: "/signup" });
  };

  const handleExpandEmailSection = () => {
    setShowEmailSection(true);
    setEmailStepError(null);
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
    signupFetcher.submit(formData, { method: "post", action: "/signup" });
  };

  const handleQuestionsSubmitFromExisting = (answers: CustomAnswerJson) => {
    const formData = new FormData();
    formData.append("intent", "register");
    formData.append("custom_answers", JSON.stringify(answers));
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
      <Button
        type="button"
        onClick={handleContinueWithGoogle}
        disabled={isCheckingEmail || isSubmittingOAuth}
        variant="outline"
        className="w-full hover:bg-muted hover:text-foreground"
        size={isOverlay ? "lg" : "default"}
      >
        {isSubmittingOAuth ? (
          <Spinner />
        ) : (
          <>
            <GoogleIcon className="mr-1 size-5 shrink-0" />
            Register with Google
          </>
        )}
      </Button>

      {!showEmailSection ? (
        <p className="text-center text-sm text-muted-foreground transition-opacity duration-300 motion-reduce:transition-none">
          or with{" "}
          <button
            type="button"
            onClick={handleExpandEmailSection}
            disabled={isCheckingEmail || isSubmittingOAuth}
            className="underline underline-offset-2 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            email
          </button>
        </p>
      ) : null}

      <motion.div
        initial={false}
        animate={{
          height: showEmailSection ? "auto" : 0,
          opacity: showEmailSection ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
          opacity: { duration: 0.25, ease: "easeOut" },
        }}
        className="overflow-hidden motion-reduce:transition-none"
        aria-hidden={!showEmailSection}
        style={{ pointerEvents: showEmailSection ? "auto" : "none" }}
      >
        <div className="space-y-5 pt-1">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2 px-1">
            <Label htmlFor="rsvp-email">Email</Label>
            <Input
              id="rsvp-email"
              type="email"
              placeholder="you@example.com"
              {...emailRegisterProps}
              ref={(node) => {
                emailRegisterRef(node);
                emailInputRef.current = node;
              }}
              disabled={isCheckingEmail || isSubmittingOAuth}
              className={isOverlay ? OVERLAY_FIELD_CLASS : undefined}
            />
          </div>

          {emailStepError && (
            <p className="px-1 text-sm text-destructive">{emailStepError}</p>
          )}

          <Button
            type="button"
            onClick={handleContinueWithEmail}
            disabled={isCheckingEmail || isSubmittingOAuth}
            className="w-full"
            size={isOverlay ? "lg" : "default"}
          >
            {isCheckingEmail ? <Spinner /> : "Continue with Email"}
          </Button>
        </div>
      </motion.div>
    </div>
  );

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
      />
    ));

  const otpStepContent = (
    <div className="space-y-4">
      <OtpInputInline
        email={otpEmail}
        communityId={communityId}
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

  React.useEffect(() => {
    if (!showEmailSection || step !== "email") return;

    const timer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 320);

    return () => window.clearTimeout(timer);
  }, [showEmailSection, step]);

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
