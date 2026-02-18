import { Link, useSearchParams } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";
import GmailIcon from "~/assets/images/GmailIcon.png";
import OutlookIcon from "~/assets/images/OutlookIcon.png";

export function meta() {
  return [
    { title: "Check Your Email - Luhive" },
    { name: "description", content: "Verify your email to complete password reset" },
  ];
}

export default function ResetPasswordEmailSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="mt-16">
      <div className="flex justify-center gap-4 pb-8 items-center text-center">
        <img src={LuhiveLogo} alt="Luhive logo" className="h-8 w-8" />
        <h1 className="font-black text-xl tracking-tight">Luhive</h1>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="rounded-full bg-primary h-20 w-20" />
            </div>
            <div className="relative rounded-full bg-primary/10 p-5 backdrop-blur-sm">
              <Mail className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
          </p>

          <div className="w-full mb-6 rounded-lg bg-muted/50 p-4 text-left">
            <p className="text-sm text-muted-foreground mb-3 font-medium">What to do next:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Check your inbox for an email from Luhive</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected to password reset page</li>
            </ol>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <img src={GmailIcon} className="h-3 w-4" /> Gmail
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://outlook.live.com/mail" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <img src={OutlookIcon} className="h-4 w-4" /> Outlook
                </a>
              </Button>
            </div>
            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border w-full">
            <div className="text-sm text-muted-foreground text-center">
              <p className="mb-1">Didn't receive the email? Check your spam folder or</p>
              <Link to="/signup" className="underline hover:text-foreground">try signing up again</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
