import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { ClipboardPaste } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/shared/components/ui/input-otp";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";
import { toast } from "sonner";

type VerifyFetcherData = {
  success?: boolean;
  error?: string;
  code?: "expired" | "invalid" | "too-many-attempts";
  joined?: boolean;
  communitySlug?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type ResendFetcherData = {
  success?: boolean;
  message?: string;
  error?: string;
};

interface OtpInputInlineProps {
  email: string;
  communityId?: string | null;
  returnTo?: string | null;
  onSuccess: (userData?: { fullName?: string | null; avatarUrl?: string | null }) => void;
  /** Event RSVP flow: pass-through to verify-otp-action */
  name?: string;
  surname?: string;
  eventId?: string;
  customAnswers?: string;
  joinCommunity?: boolean;
  eventSessionId?: string;
  eventUtmSource?: string;
  eventUtmMedium?: string | null;
  eventUtmCampaign?: string | null;
  eventUtmContent?: string | null;
  eventUtmTerm?: string | null;
  eventFirstVisitStartedAt?: string;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpInputInline({
  email,
  communityId,
  returnTo,
  onSuccess,
  name,
  surname,
  eventId,
  customAnswers,
  joinCommunity,
  eventSessionId,
  eventUtmSource,
  eventUtmMedium,
  eventUtmCampaign,
  eventUtmContent,
  eventUtmTerm,
  eventFirstVisitStartedAt,
}: OtpInputInlineProps) {
  const verifyFetcher = useFetcher<VerifyFetcherData>();
  const resendFetcher = useFetcher<ResendFetcherData>();
  const [otpValue, setOtpValue] = useState("");
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const autoSubmittedTokenRef = useRef("");
  const completedOnceRef = useRef(false);
  const otpContainerRef = useRef<HTMLDivElement>(null);

  const isVerifying = verifyFetcher.state === "submitting";
  const isResending = resendFetcher.state === "submitting";

  const focusOtpInput = () => {
    window.setTimeout(() => {
      const input = otpContainerRef.current?.querySelector("input") as HTMLInputElement | null;
      input?.focus();
    }, 0);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!resendFetcher.data) {
      return;
    }

    if (resendFetcher.data.success) {
      toast.success(resendFetcher.data.message || "A new code was sent.");
      setOtpValue("");
      setDisplayError(null);
      autoSubmittedTokenRef.current = "";
      setSecondsLeft(RESEND_SECONDS);
      focusOtpInput();
      return;
    }

    if (resendFetcher.data.error) {
      toast.error(resendFetcher.data.error);
    }
  }, [resendFetcher.data]);

  useEffect(() => {
    if (!verifyFetcher.data) {
      return;
    }

    if (verifyFetcher.data.error) {
      setDisplayError(verifyFetcher.data.error);

      if (verifyFetcher.data.code === "invalid") {
        setOtpValue("");
        autoSubmittedTokenRef.current = "";
        focusOtpInput();
      }

      return;
    }

    setDisplayError(null);
  }, [verifyFetcher.data]);

  useEffect(() => {
    if (displayError && otpValue.length > 0) {
      setDisplayError(null);
    }
  }, [displayError, otpValue]);

  useEffect(() => {
    if (!verifyFetcher.data?.success || completedOnceRef.current) {
      return;
    }

    completedOnceRef.current = true;
    setDisplayError(null);
    onSuccess({
      fullName: verifyFetcher.data.fullName ?? null,
      avatarUrl: verifyFetcher.data.avatarUrl ?? null,
    });
  }, [onSuccess, verifyFetcher.data]);

  useEffect(() => {
    if (otpValue.length < OTP_LENGTH) {
      autoSubmittedTokenRef.current = "";
      return;
    }

    if (isVerifying || otpValue === autoSubmittedTokenRef.current) {
      return;
    }

    autoSubmittedTokenRef.current = otpValue;

    const formData = new FormData(); 
    formData.append("intent", "verify");
    formData.append("_modal", "true");
    formData.append("email", email);
    formData.append("token", otpValue);
    if (communityId) {
      formData.append("communityId", communityId);
    }
    if (returnTo) {
      formData.append("returnTo", returnTo);
    }
    if (name) formData.append("name", name);
    if (surname) formData.append("surname", surname);
    if (eventId) formData.append("eventId", eventId);
    if (customAnswers) formData.append("customAnswers", customAnswers);
    if (eventSessionId) formData.append("eventSessionId", eventSessionId);
    if (eventUtmSource) formData.append("eventUtmSource", eventUtmSource);
    if (eventUtmMedium) formData.append("eventUtmMedium", eventUtmMedium);
    if (eventUtmCampaign) formData.append("eventUtmCampaign", eventUtmCampaign);
    if (eventUtmContent) formData.append("eventUtmContent", eventUtmContent);
    if (eventUtmTerm) formData.append("eventUtmTerm", eventUtmTerm);
    if (eventFirstVisitStartedAt) formData.append("eventFirstVisitStartedAt", eventFirstVisitStartedAt);
    if (joinCommunity === false) formData.append("joinCommunity", "false");

    verifyFetcher.submit(formData, { method: "post", action: "/auth/verify-otp" });
  }, [
    communityId,
    customAnswers,
    email,
    eventId,
    eventSessionId,
    eventUtmCampaign,
    eventUtmContent,
    eventUtmMedium,
    eventUtmSource,
    eventUtmTerm,
    eventFirstVisitStartedAt,
    isVerifying,
    joinCommunity,
    name,
    otpValue,
    returnTo,
    surname,
    verifyFetcher,
  ]);

  const handleVerifySubmit = () => {
    const formData = new FormData();
    formData.append("intent", "verify");
    formData.append("_modal", "true");
    formData.append("email", email);
    formData.append("token", otpValue);
    if (communityId) {
      formData.append("communityId", communityId);
    }
    if (returnTo) {
      formData.append("returnTo", returnTo);
    }
    if (name) formData.append("name", name);
    if (surname) formData.append("surname", surname);
    if (eventId) formData.append("eventId", eventId);
    if (customAnswers) formData.append("customAnswers", customAnswers);
    if (eventSessionId) formData.append("eventSessionId", eventSessionId);
    if (eventUtmSource) formData.append("eventUtmSource", eventUtmSource);
    if (eventUtmMedium) formData.append("eventUtmMedium", eventUtmMedium);
    if (eventUtmCampaign) formData.append("eventUtmCampaign", eventUtmCampaign);
    if (eventUtmContent) formData.append("eventUtmContent", eventUtmContent);
    if (eventUtmTerm) formData.append("eventUtmTerm", eventUtmTerm);
    if (eventFirstVisitStartedAt) formData.append("eventFirstVisitStartedAt", eventFirstVisitStartedAt);
    if (joinCommunity === false) formData.append("joinCommunity", "false");

    verifyFetcher.submit(formData, { method: "post", action: "/auth/verify-otp" });
  };

  const handleResendSubmit = () => {
    const formData = new FormData();
    formData.append("intent", "resend");
    formData.append("_modal", "true");
    formData.append("email", email);

    resendFetcher.submit(formData, { method: "post", action: "/auth/verify-otp" });
  };

  const handlePasteOrVerify = async () => {
    if (otpValue.length < OTP_LENGTH) {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (digits) setOtpValue(digits);
    } else {
      handleVerifySubmit();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
      </p>

      <div ref={otpContainerRef} className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otpValue}
          onChange={(value) => setOtpValue(value)}
          pattern="^[0-9]*$"
          inputMode="numeric"
          disabled={isVerifying}
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-11 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-11 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-11 text-lg" />
            <InputOTPSlot index={3} className="h-12 w-11 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-11 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-11 text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {displayError && (
        <p className="text-sm text-destructive text-center">{displayError}</p>
      )}

      <Button
        type="button"
        onClick={handlePasteOrVerify}
        disabled={isVerifying}
        className="w-full"
      >
        {isVerifying ? (
          <Spinner />
        ) : otpValue.length === OTP_LENGTH ? (
          "Paste Code"
        ) : (
          <>
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste Code
          </>
        )}
      </Button>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResendSubmit}
          disabled={secondsLeft > 0 || isResending}
          className="text-muted-foreground text-sm"
        >
          {isResending
            ? "Sending..."
            : secondsLeft > 0
              ? `Resend code in ${secondsLeft}s`
              : "Resend code"}
        </Button>
      </div>
    </div>
  );
}
