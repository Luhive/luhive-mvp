import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/shared/components/ui/input-otp";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";

type VerifyOtpLoaderData = {
  email: string;
  communityId: string | null;
  returnTo: string | null;
};

type VerifyOtpActionData = {
  success: boolean;
  message?: string;
  error?: string;
  code?: "expired" | "invalid" | "too-many-attempts";
};

const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;

export function VerifyOtpForm() {
  const { email, communityId, returnTo } = useLoaderData<VerifyOtpLoaderData>();
  const actionData = useActionData<VerifyOtpActionData>();
  const resendFetcher = useFetcher<VerifyOtpActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [otpValue, setOtpValue] = useState("");
  const [storedReturnTo, setStoredReturnTo] = useState<string | null>(null);
  const [lastFailedToken, setLastFailedToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const autoSubmittedTokenRef = useRef("");
  const verifyFormRef = useRef<HTMLFormElement>(null);
  const effectiveReturnTo = returnTo || storedReturnTo;

  const submittedIntent = navigation.formData?.get("intent") as string | null;
  const isVerifying = navigation.state === "submitting" && submittedIntent === "verify";
  const isResending = resendFetcher.state === "submitting";
  const visibleError =
    !isVerifying && actionData?.error && otpValue === lastFailedToken ? actionData.error : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const path = window.localStorage.getItem("post_login_return_to") || "";
    setStoredReturnTo(path.startsWith("/") ? path : null);
  }, []);

  useEffect(() => {
    if (!resendFetcher.data) {
      return;
    }

    if (resendFetcher.data.success) {
      toast.success(resendFetcher.data.message || "A new code was sent.");
      setSecondsLeft(RESEND_SECONDS);
      setOtpValue("");
      setLastFailedToken(null);
      autoSubmittedTokenRef.current = "";
      return;
    }

    if (resendFetcher.data.error) {
      toast.error(resendFetcher.data.error);
    }
  }, [resendFetcher.data]);

  useEffect(() => {
    if (!actionData?.error) {
      return;
    }

    setLastFailedToken(autoSubmittedTokenRef.current || otpValue);
  }, [actionData]);

  useEffect(() => {
    if (otpValue.length < OTP_LENGTH) {
      autoSubmittedTokenRef.current = "";
      return;
    }

    if (isVerifying || otpValue === autoSubmittedTokenRef.current) {
      return;
    }

    autoSubmittedTokenRef.current = otpValue;

    if (verifyFormRef.current) {
      submit(verifyFormRef.current, { method: "post" });
    }
  }, [isVerifying, otpValue, submit]);

  const handleResendSubmit = () => {
    const formData = new FormData();
    formData.append("intent", "resend");
    formData.append("email", email);
    resendFetcher.submit(formData, { method: "post", action: "/auth/verify-otp" });
  };

  const handlePasteOrVerify = async () => {
    if (otpValue.length < OTP_LENGTH) {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (digits) setOtpValue(digits);
    } else if (verifyFormRef.current) {
      submit(verifyFormRef.current, { method: "post" });
    }
  };

  return (
    <div className="mt-16">
      <div className="flex flex-col items-center text-center">
        <img src={LuhiveLogo} alt="Luhive logo" className="h-12 w-12 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Enter Verification Code</h1>
        <p className="text-sm text-muted-foreground mb-4">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <Form ref={verifyFormRef} method="post" className="flex flex-col items-center gap-4">
          <input type="hidden" name="intent" value="verify" />
          <input type="hidden" name="email" value={email} />
          {communityId && <input type="hidden" name="communityId" value={communityId} />}
          {effectiveReturnTo && <input type="hidden" name="returnTo" value={effectiveReturnTo} />}
          <input type="hidden" name="token" value={otpValue} />

          <div className="flex justify-center">
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

          {visibleError && (
            <p className="text-sm text-destructive text-center">{visibleError}</p>
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
        </Form>

        <div className="mt-4 flex justify-center">
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

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link to="/signup" className="underline">
            Go back to sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
