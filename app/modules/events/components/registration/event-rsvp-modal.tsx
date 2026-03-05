"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Checkbox } from "~/shared/components/ui/checkbox";
import { Spinner } from "~/shared/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import { FullscreenModal } from "~/shared/components/ui/fullscreen-modal";
import { useFetcher, useNavigate, useSubmit } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { OtpInputInline } from "~/modules/auth/components/otp-input-inline";
import { CustomQuestionsForm } from "~/modules/events/components/registration/custom-questions-form";
import type { CustomQuestionJson } from "~/modules/events/model/event.types";
import type { CustomAnswerJson } from "~/modules/events/model/event.types";

const emailSchema = z.object({ email: z.string().email() });
type EmailFormValues = z.infer<typeof emailSchema>;

const detailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
});
type DetailsFormValues = z.infer<typeof detailsSchema>;

type EventRsvpStep = "email" | "details" | "questions" | "otp";

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

export interface EventRsvpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  communitySlug: string;
  communityId: string;
  communityName: string;
  hasCustomQuestions: boolean;
  customQuestions: CustomQuestionJson | null;
  userPhone?: string | null;
  returnTo?: string;
}

export function EventRsvpModal({
  open,
  onOpenChange,
  eventId,
  communitySlug,
  communityId,
  communityName,
  hasCustomQuestions,
  customQuestions,
  userPhone,
  returnTo,
}: EventRsvpModalProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const submit = useSubmit();
  const checkEmailFetcher = useFetcher<CheckEmailFetcherData>();
  const signupFetcher = useFetcher<SignupFetcherData>();
  const questionsFetcher = useFetcher();

  const [step, setStep] = React.useState<EventRsvpStep>("email");
  const [userExists, setUserExists] = React.useState<boolean | null>(null);
  const [otpEmail, setOtpEmail] = React.useState("");
  const [emailStepError, setEmailStepError] = React.useState<string | null>(null);
  const [joinCommunity, setJoinCommunity] = React.useState(true);
  const [customAnswers, setCustomAnswers] = React.useState<CustomAnswerJson | null>(null);

  const emailForm = useForm<EmailFormValues>({
    defaultValues: { email: "" },
  });
  const detailsForm = useForm<DetailsFormValues>({
    defaultValues: { name: "", surname: "" },
  });

  const isCheckingEmail =
    checkEmailFetcher.state === "submitting" || checkEmailFetcher.state === "loading";
  const isSubmittingSignup =
    signupFetcher.state === "submitting" || signupFetcher.state === "loading";
  const isSubmittingQuestions =
    questionsFetcher.state === "submitting" || questionsFetcher.state === "loading";

  const pathname = `/c/${communitySlug}/events/${eventId}`;
  const eventActionUrl = pathname;

  // checkEmailFetcher: existing user -> otp, new user -> details
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

  // signupFetcher: new user after signup -> otp
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

  // questionsFetcher: existing user questions submitted
  React.useEffect(() => {
    const data = questionsFetcher.data as { success?: boolean; error?: string } | undefined;
    if (!data || questionsFetcher.state !== "idle") return;

    if (data.success) {
      toast.success("Successfully registered for the event!");
      onOpenChange(false);
      navigate(pathname + (typeof window !== "undefined" ? window.location.search : ""), {
        replace: true,
      });
    } else if (data.error) {
      toast.error(data.error);
    }
  }, [questionsFetcher.data, questionsFetcher.state, onOpenChange, navigate, pathname]);

  // Reset on close
  React.useEffect(() => {
    if (open) return;
    emailForm.reset({ email: "" });
    detailsForm.reset({ name: "", surname: "" });
    setStep("email");
    setUserExists(null);
    setOtpEmail("");
    setEmailStepError(null);
    setJoinCommunity(true);
    setCustomAnswers(null);
  }, [open, emailForm, detailsForm]);

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

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = detailsForm.getValues();
    const email = emailForm.getValues("email")?.trim() || "";

    if (hasCustomQuestions) {
      setStep("questions");
      return;
    }

    const formData = new FormData();
    formData.append("intent", "event-rsvp-signup");
    formData.append("_modal", "true");
    formData.append("name", values.name);
    formData.append("surname", values.surname);
    formData.append("email", email);
    formData.append("eventId", eventId);
    formData.append("communityId", communityId);
    formData.append("joinCommunity", joinCommunity ? "true" : "false");
    signupFetcher.submit(formData, { method: "post", action: "/signup" });
  };

  const handleQuestionsSubmitFromDetails = (answers: CustomAnswerJson) => {
    setCustomAnswers(answers);
    const values = detailsForm.getValues();
    const email = emailForm.getValues("email")?.trim() || "";
    const formData = new FormData();
    formData.append("intent", "event-rsvp-signup");
    formData.append("_modal", "true");
    formData.append("name", values.name);
    formData.append("surname", values.surname);
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
    questionsFetcher.submit(formData, {
      method: "post",
      action: eventActionUrl,
    });
  };

  const handleOtpSuccessExistingUser = () => {
    if (hasCustomQuestions) {
      setStep("questions");
    } else {
      toast.success("Successfully registered for the event!");
      onOpenChange(false);
      navigate(pathname + (typeof window !== "undefined" ? window.location.search : ""), {
        replace: true,
      });
    }
  };

  const handleOtpSuccessNewUser = () => {
    toast.success("Successfully registered for the event!");
    onOpenChange(false);
    navigate(pathname + (typeof window !== "undefined" ? window.location.search : ""), {
      replace: true,
    });
  };

  const emailStepContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rsvp-email">Email</Label>
        <Input
          id="rsvp-email"
          type="email"
          placeholder="you@example.com"
          {...emailForm.register("email")}
          disabled={isCheckingEmail}
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
      >
        {isCheckingEmail ? <Spinner /> : "Continue"}
      </Button>
    </div>
  );

  const detailsStepContent = (
    <form onSubmit={handleDetailsSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rsvp-name">Name</Label>
        <Input
          id="rsvp-name"
          placeholder="John"
          {...detailsForm.register("name")}
          disabled={isSubmittingSignup}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-surname">Surname</Label>
        <Input
          id="rsvp-surname"
          placeholder="Doe"
          {...detailsForm.register("surname")}
          disabled={isSubmittingSignup}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="join-community"
          checked={joinCommunity}
          onCheckedChange={(v) => setJoinCommunity(v === true)}
        />
        <label
          htmlFor="join-community"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Become a member of {communityName}?
        </label>
      </div>
      {hasCustomQuestions ? (
        <Button
          type="button"
          onClick={() => setStep("questions")}
          disabled={isSubmittingSignup}
          className="w-full"
        >
          Continue
        </Button>
      ) : (
        <Button type="submit" disabled={isSubmittingSignup} className="w-full">
          {isSubmittingSignup ? <Spinner /> : "Continue to Verify"}
        </Button>
      )}
    </form>
  );

  const joinCommunityCheckbox = (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="join-community-questions"
        checked={joinCommunity}
        onCheckedChange={(v) => setJoinCommunity(v === true)}
      />
      <label
        htmlFor="join-community-questions"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Become a member of {communityName}?
      </label>
    </div>
  );

  const questionsStepContent =
    hasCustomQuestions &&
    (userExists ? (
      <CustomQuestionsForm
        open={step === "questions"}
        onOpenChange={() => {}}
        eventId={eventId}
        customQuestions={customQuestions}
        userName={otpEmail?.split("@")[0] || undefined}
        userEmail={otpEmail}
        userPhone={userPhone ?? undefined}
        onSubmit={handleQuestionsSubmitFromExisting}
        isSubmitting={isSubmittingQuestions}
        inline
      />
    ) : (
      <CustomQuestionsForm
        open={step === "questions"}
        onOpenChange={() => {}}
        eventId={eventId}
        customQuestions={customQuestions}
        userName={`${detailsForm.getValues("name")} ${detailsForm.getValues("surname")}`.trim()}
        userEmail={emailForm.getValues("email")?.trim()}
        userPhone={userPhone ?? undefined}
        onSubmit={(answers) => handleQuestionsSubmitFromDetails(answers)}
        isSubmitting={isSubmittingSignup}
        inline
        
      />
    ));

  const otpStepContent = (
    <div className="space-y-4">
      {!userExists && !hasCustomQuestions && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="join-community-otp"
            checked={joinCommunity}
            onCheckedChange={(v) => setJoinCommunity(v === true)}
          />
          <label
            htmlFor="join-community-otp"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Become a member of {communityName}?
          </label>
        </div>
      )}
      <OtpInputInline
        email={otpEmail}
        communityId={joinCommunity ? communityId : undefined}
        returnTo={returnTo ?? undefined}
        onSuccess={userExists ? handleOtpSuccessExistingUser : handleOtpSuccessNewUser}
        name={!userExists ? detailsForm.getValues("name") : undefined}
        surname={!userExists ? detailsForm.getValues("surname") : undefined}
        eventId={!userExists ? eventId : undefined}
        customAnswers={!userExists && customAnswers ? JSON.stringify(customAnswers) : undefined}
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

  if (isMobile) {
    return (
      <FullscreenModal open={open} onOpenChange={onOpenChange} title={title}>
        {step === "questions" ? (
          questionsStepContent
        ) : (
          <div className="space-y-4">{stepContent}</div>
        )}
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
        {step === "questions" ? (
          questionsStepContent
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">{stepContent}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
