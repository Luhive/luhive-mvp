import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Routes } from "~/shared/lib/routing/routes";
import type { InviteSuccessResult } from "~/modules/events/model/invite.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Spinner } from "~/shared/components/ui/spinner";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onInviteSuccess?: (invite: InviteSuccessResult) => void;
}

export function InviteModal({
  open,
  onOpenChange,
  eventId,
  onInviteSuccess,
}: InviteModalProps) {
  const fetcher = useFetcher<{
    success?: boolean;
    error?: string;
    message?: string;
    invite?: InviteSuccessResult;
  }>();
  const hasProcessedResponseRef = useRef(false);
  const submittedRef = useRef(false);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");

  const isSubmitting =
    fetcher.state === "submitting" || fetcher.state === "loading";

  useEffect(() => {
    if (!open) {
      hasProcessedResponseRef.current = false;
      submittedRef.current = false;
      setInviteeName("");
      setInviteeEmail("");
      return;
    }

    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      submittedRef.current &&
      !hasProcessedResponseRef.current
    ) {
      hasProcessedResponseRef.current = true;
      submittedRef.current = false;

      if (fetcher.data.success) {
        toast.success(fetcher.data.message || "Invitation sent successfully.");
        if (fetcher.data.invite) {
          onInviteSuccess?.(fetcher.data.invite);
        }
        onOpenChange(false);
        setInviteeName("");
        setInviteeEmail("");
      } else {
        toast.error(fetcher.data.error || "Failed to send invitation.");
      }
    }
  }, [open, fetcher.state, fetcher.data, onOpenChange, onInviteSuccess]);

  const handleSubmit = (eventForm: React.FormEvent<HTMLFormElement>) => {
    eventForm.preventDefault();

    submittedRef.current = true;
    hasProcessedResponseRef.current = false;

    fetcher.submit(
      {
        eventId,
        inviteeName: inviteeName.trim(),
        inviteeEmail: inviteeEmail.trim(),
      },
      {
        method: "POST",
        action: Routes.api.events.invite,
        encType: "application/json",
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>
            Send an email invitation to join this event. They can accept and register
            without a verification code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteeName">Name</Label>
            <Input
              id="inviteeName"
              placeholder="Jane Doe"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteeEmail">Email</Label>
            <Input
              id="inviteeEmail"
              type="email"
              placeholder="jane@example.com"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : (
                "Send invitation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface InviteSomeoneButtonProps {
  eventId: string;
  variant?: "default" | "outline";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  showIcon?: boolean;
  onInviteSuccess?: (invite: InviteSuccessResult) => void;
}

export function InviteSomeoneButton({
  eventId,
  variant = "outline",
  className,
  size = "lg",
  label = "Invite someone",
  showIcon = true,
  onInviteSuccess,
}: InviteSomeoneButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className ?? "w-full"}
        size={size}
        onClick={() => setOpen(true)}
      >
        {showIcon ? <UserPlus className="h-4 w-4 mr-2" /> : null}
        {label}
      </Button>
      <InviteModal
        open={open}
        onOpenChange={setOpen}
        eventId={eventId}
        onInviteSuccess={onInviteSuccess}
      />
    </>
  );
}
