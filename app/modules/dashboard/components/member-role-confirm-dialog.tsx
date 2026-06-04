import { IconShield, IconShieldOff } from "@tabler/icons-react";
import { Button } from "~/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";

type MemberRoleConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: "promote" | "demote" | null;
  memberName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
};

export function MemberRoleConfirmDialog({
  open,
  onOpenChange,
  intent,
  memberName,
  isSubmitting,
  onConfirm,
}: MemberRoleConfirmDialogProps) {
  const isPromote = intent === "promote";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPromote ? (
              <IconShield className="h-5 w-5 text-primary" />
            ) : (
              <IconShieldOff className="h-5 w-5 text-destructive" />
            )}
            {isPromote ? "Make admin" : "Remove admin"}
          </DialogTitle>
          <DialogDescription>
            {isPromote ? (
              <>
                Grant{" "}
                <span className="font-semibold text-foreground">{memberName}</span>{" "}
                dashboard access as a community admin.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{memberName}</span>{" "}
                will lose dashboard access.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={isPromote ? "default" : "destructive"}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isPromote
                ? "Promoting..."
                : "Removing..."
              : isPromote
                ? "Make admin"
                : "Remove admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
