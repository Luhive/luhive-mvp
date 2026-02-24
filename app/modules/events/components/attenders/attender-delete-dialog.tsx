import { AlertTriangle } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";

interface AttenderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attenderName: string | undefined;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function AttenderDeleteDialog({
  open,
  onOpenChange,
  attenderName,
  isDeleting,
  onConfirm,
}: AttenderDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Attender
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">{attenderName}</span> from the event?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
