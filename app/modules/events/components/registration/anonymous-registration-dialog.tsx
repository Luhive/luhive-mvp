import { useIsMobile } from "~/shared/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/shared/components/ui/drawer";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Form, useFetcher, useNavigation } from "react-router";
import { toast } from "sonner";

interface AnonymousRegistrationResponse {
  success?: boolean;
  error?: string;
  verificationSent?: boolean;
  needsCustomQuestions?: boolean;
  anonymousName?: string;
  anonymousEmail?: string;
  email?: string;
}

interface AnonymousRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  communitySlug: string;
  preventNavigation?: boolean;
  onSuccess?: (data: { email: string }) => void;
  onNeedsCustomQuestions?: (data: { anonymousName: string; anonymousEmail: string }) => void;
}

export function AnonymousRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  communitySlug,
  preventNavigation = false,
  onSuccess,
  onNeedsCustomQuestions,
}: AnonymousRegistrationDialogProps) {
  const isMobile = useIsMobile();
  const fetcher = useFetcher<AnonymousRegistrationResponse>();
  const navigation = useNavigation();
  const lastHandledDataRef = useRef<AnonymousRegistrationResponse | undefined>(undefined);
  const isSubmitting = preventNavigation
    ? fetcher.state === "submitting" || fetcher.state === "loading"
    : navigation.state === "submitting" || navigation.state === "loading";

  useEffect(() => {
    if (!preventNavigation) return;
    if (!fetcher.data) return;
    if (fetcher.data === lastHandledDataRef.current) return;

    lastHandledDataRef.current = fetcher.data;

    if (fetcher.data.error) {
      toast.error(fetcher.data.error);
      return;
    }

    if (fetcher.data.success && fetcher.data.needsCustomQuestions) {
      const anonymousName = fetcher.data.anonymousName;
      const anonymousEmail = fetcher.data.anonymousEmail;

      if (anonymousName && anonymousEmail) {
        onNeedsCustomQuestions?.({ anonymousName, anonymousEmail });
        onOpenChange(false);
      }
      return;
    }

    if (fetcher.data.success && fetcher.data.verificationSent) {
      const email = fetcher.data.email;
      if (email) {
        onSuccess?.({ email });
      }
      onOpenChange(false);
    }
  }, [fetcher.data, onNeedsCustomQuestions, onOpenChange, onSuccess, preventNavigation]);

  const content = (
    <div className="space-y-4">
      {/* Informational Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">
              One-Click RSVP for Future Events!
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a free account and skip the form next time. Register instantly with a single click.
            </p>
            <Button
              variant="link"
              className="h-auto p-0 text-xs font-semibold"
              asChild
            >
              <a href="/signup" target="_blank" rel="noopener noreferrer">
                Sign up now
                <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      {preventNavigation ? (
        <fetcher.Form method="post" action={`/c/${communitySlug}/events/${eventId}`} className="space-y-4">
          <input type="hidden" name="intent" value="anonymous-register" />
          <input type="hidden" name="_source" value="sidebar" />

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              We'll send you a verification link to confirm your registration.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Register for Event"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By registering, you agree to receive event-related emails.
          </p>
        </fetcher.Form>
      ) : (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="anonymous-register" />

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                We'll send you a verification link to confirm your registration.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Register for Event"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By registering, you agree to receive event-related emails.
            </p>
          </Form>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Register for Event</DrawerTitle>
            <DrawerDescription>
              Enter your details to register. We'll send you a verification email.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>
            Enter your details to register. We'll send you a verification email.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

