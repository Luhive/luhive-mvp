export { loader } from "~/modules/auth/server/register-loader.server";
export { action } from "~/modules/auth/server/register-action.server";
export { meta } from "~/modules/auth/model/register-meta";

import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "~/shared/components/ui/input";
import { Button } from "~/shared/components/ui/button";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";
import { Spinner } from "~/shared/components/ui/spinner";
import { toast } from "sonner";

type ActionData = {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: {
    name?: string[];
    surname?: string[];
    email?: string[];
    password?: string[];
  };
};

export default function RegisterPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const submittingIntent = navigation.formData?.get("intent") as string | null;
  const isSubmittingPassword = isSubmitting && submittingIntent === "password";
  const isSubmittingOAuth = isSubmitting && submittingIntent === "oauth";

  const [formKey, setFormKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [isEmailStepComplete, setIsEmailStepComplete] = useState(false);
  const [emailStepError, setEmailStepError] = useState<string | null>(null);

  const nameParam = searchParams.get("name") || "";
  const surnameParam = searchParams.get("surname") || "";
  const emailParam = searchParams.get("email") || "";
  const communityIdParam = searchParams.get("communityId") || "";
  const communityNameParam = searchParams.get("communityName") || "";

  const fieldErrors = actionData?.fieldErrors;
  const hasDetailsErrors = Boolean(
    fieldErrors?.name || fieldErrors?.surname || fieldErrors?.password
  );

  useEffect(() => {
    setEmailValue(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (nameParam || surnameParam || hasDetailsErrors) {
      setIsEmailStepComplete(true);
    }
  }, [nameParam, surnameParam, hasDetailsErrors]);

  const handleContinueWithEmail = () => {
    const trimmedEmail = emailValue.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEmailStepError("Please enter a valid email address.");
      return;
    }

    setEmailStepError(null);
    setIsEmailStepComplete(true);
  };

  useEffect(() => {
    if (actionData) {
      if ("error" in actionData && actionData.error) {
        toast.error(String(actionData.error));
      } else if ("message" in actionData && actionData.message) {
        toast.success(String(actionData.message));
        setFormKey((prev) => prev + 1);
      }
    }
  }, [actionData]);

  return (
    <div className="mt-16">
      <div className="flex flex-col items-center text-center">
        <img src={LuhiveLogo} alt="Luhive logo" className="h-12 w-12 mb-6" />
        <h1 className="text-2xl font-bold mb-2">
          {communityNameParam
            ? `Join ${communityNameParam}`
            : "Welcome to Our Platform!"}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {communityNameParam
            ? "Create your account to join the community"
            : "Lets see who you are."}
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        {communityNameParam && (
          <div className="mb-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              By joining {communityNameParam}, you'll receive email
              notifications about announcements, posts, and events. You can
              manage your notification preferences anytime.
            </p>
          </div>
        )}

        <Form method="post" className="flex" replace>
          <input type="hidden" name="intent" value="oauth" />
          <input type="hidden" name="provider" value="google" />
          {communityIdParam && (
            <input type="hidden" name="communityId" value={communityIdParam} />
          )}
          <Button
            disabled={isSubmittingOAuth}
            variant="outline"
            className="w-full hover:bg-muted hover:text-foreground"
            type="submit"
          >
            {isSubmittingOAuth ? (
              <Spinner />
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="size-5 mr-1"
                  aria-hidden
                  focusable="false"
                >
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.843 32.658 29.29 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.143-7.656 19.143-20 0-1.341-.147-2.652-.432-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.813C14.297 16.128 18.787 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 15.316 4 7.954 8.924 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.196 0 9.86-1.992 13.38-5.223l-6.173-5.234C29.093 34.484 26.682 35.5 24 35.5c-5.262 0-9.799-3.507-11.397-8.248l-6.52 5.017C8.704 39.043 15.83 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 2.977-3.279 5.308-6.093 6.443l.001-.001 6.173 5.234C34.84 40.782 43 36 43 24c0-1.341-.147-2.652-.432-3.917z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </Form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Form key={formKey} method="post" className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="password" />
          {communityIdParam && (
            <input type="hidden" name="communityId" value={communityIdParam} />
          )}
          <div className="flex flex-col gap-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={emailValue}
              onChange={(event) => {
                setEmailValue(event.target.value);
                if (emailStepError) setEmailStepError(null);
              }}
              className={
                fieldErrors?.email || emailStepError ? "border-destructive" : ""
              }
            />
            {fieldErrors?.email && (
              <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
            )}
            {emailStepError && (
              <p className="text-sm text-destructive">{emailStepError}</p>
            )}
          </div>

          {!isEmailStepComplete ? (
            <Button type="button" onClick={handleContinueWithEmail}>
              Sign up with Email
            </Button>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Name"
                  defaultValue={nameParam}
                  className={fieldErrors?.name ? "border-destructive" : ""}
                />
                {fieldErrors?.name && (
                  <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  id="surname"
                  name="surname"
                  type="text"
                  placeholder="Surname"
                  defaultValue={surnameParam}
                  className={fieldErrors?.surname ? "border-destructive" : ""}
                />
                {fieldErrors?.surname && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.surname[0]}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className={
                      fieldErrors?.password ? "border-destructive pr-10" : "pr-10"
                    }
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
                {fieldErrors?.password && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>
              <Button disabled={isSubmittingPassword} type="submit">
                {isSubmittingPassword ? <Spinner /> : "Sign up with Email"}
              </Button>
            </>
          )}
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already with us?{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
