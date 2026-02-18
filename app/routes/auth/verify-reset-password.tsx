export { loader } from "~/modules/auth/server/verify-reset-password-loader.server";
export { action } from "~/modules/auth/server/verify-reset-password-action.server";
export { meta } from "~/modules/auth/model/verify-reset-password-meta";

import { Form, Link, useActionData, useNavigation } from "react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "~/shared/components/ui/input";
import { Button } from "~/shared/components/ui/button";
import { Label } from "~/shared/components/ui/label";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";
import { Spinner } from "~/shared/components/ui/spinner";
import { toast } from "sonner";

export default function VerifyResetPasswordPage() {
  const actionData = useActionData<{ success: boolean; error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isNavigating = navigation.state === "loading";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (actionData && "error" in actionData && actionData.error) {
      toast.error(String(actionData.error));
    }
  }, [actionData]);

  if (isNavigating) {
    return (
      <div className="mt-16">
        <div className="flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95"
          >
            <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">Verifying Token...</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Please wait while we verify your reset link.
          </p>
        </div>
        <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12 flex justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="flex flex-col items-center text-center">
        <Link
          to="/"
          className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95"
        >
          <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
        </Link>
        <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your new password below.
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <Form method="post" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter new password"
                className="pr-10"
                required
                minLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and
              number
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                className="pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Spinner /> : "Reset Password"}
          </Button>
        </Form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="underline hover:text-foreground">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
