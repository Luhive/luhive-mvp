export { loader } from "~/modules/auth/server/forgot-password-loader.server";
export { action } from "~/modules/auth/server/forgot-password-action.server";
export { meta } from "~/modules/auth/model/forgot-password-meta";

import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "~/shared/components/ui/input";
import { Button } from "~/shared/components/ui/button";
import { Label } from "~/shared/components/ui/label";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";
import { Spinner } from "~/shared/components/ui/spinner";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<{ success: boolean; error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errorParam = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "invalid-token":
        return "The reset link is invalid. Please request a new one.";
      case "expired-token":
        return "The reset link has expired. Please request a new one.";
      case "missing-token":
        return "No reset token found. Please use the link from your email.";
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage(errorParam);

  useEffect(() => {
    if (actionData && "error" in actionData && actionData.error) {
      toast.error(String(actionData.error));
    }
  }, [actionData]);

  return (
    <div className="mt-16">
      <div className="flex flex-col items-center text-center">
        <Link
          to="/"
          className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95"
        >
          <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
        </Link>
        <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
        <p className="text-sm text-muted-foreground mb-4">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        {errorMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        <Form method="post" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Spinner /> : "Send Reset Link"}
          </Button>
        </Form>

        <div className="mt-6 flex items-center justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="underline hover:text-foreground">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
