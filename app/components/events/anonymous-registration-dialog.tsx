import { useIsMobile } from "~/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Sparkles, ArrowRight } from "lucide-react";
import { Form, useNavigation } from "react-router";

interface AnonymousRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  communitySlug: string;
}

export function AnonymousRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  communitySlug,
}: AnonymousRegistrationDialogProps) {
  const isMobile = useIsMobile();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

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

