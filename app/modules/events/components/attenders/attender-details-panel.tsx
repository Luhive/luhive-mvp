import { Badge } from "~/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Separator } from "~/shared/components/ui/separator";
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
import { cn } from "~/shared/lib/utils";
import { RegistrationAnswersDisplay } from "~/modules/events/components/registration/registration-answers-display";
import type { Attender } from "~/modules/events/model/attender.types";
import { rsvpStatusConfig, approvalStatusConfig } from "~/modules/events/model/attender.types";
import type { CustomQuestionJson, CustomAnswerJson } from "~/modules/events/model/event.types";
import type { EventApprovalStatus } from "~/shared/models/entity.types";

interface AttenderDetailsPanelProps {
  attender: Attender;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customQuestions: CustomQuestionJson | null;
  isMobile: boolean;
}

function AttenderInfo({
  attender,
  customQuestions,
}: {
  attender: Attender;
  customQuestions: CustomQuestionJson | null;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={attender.avatar_url || ""} alt={attender.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {attender.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{attender.name}</div>
            {attender.is_anonymous && (
              <Badge variant="secondary" className="mt-1">
                Anonymous
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{attender.email || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Phone</span>
            <span className="text-sm font-medium">{attender.phone || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">RSVP Status</span>
            <Badge variant={rsvpStatusConfig[attender.rsvp_status].variant}>
              {rsvpStatusConfig[attender.rsvp_status].label}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Approval Status</span>
            <Badge
              variant="outline"
              className={cn(
                "border-transparent font-medium",
                approvalStatusConfig[attender.approval_status as EventApprovalStatus]?.className,
                attender.approval_status === "approved" &&
                  "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
              )}
            >
              {approvalStatusConfig[attender.approval_status as EventApprovalStatus]?.label ||
                "Approved"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Verified</span>
            <Badge variant={attender.is_verified ? "default" : "outline"}>
              {attender.is_verified ? "Verified" : "Pending"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Registered At</span>
            <span className="text-sm font-medium">
              {attender.registered_at
                ? new Date(attender.registered_at).toLocaleString()
                : "-"}
            </span>
          </div>
        </div>
      </div>

      {customQuestions && attender.custom_answers && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">Custom Answers</h3>
            <RegistrationAnswersDisplay
              answers={attender.custom_answers as CustomAnswerJson | null}
              questions={customQuestions}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function AttenderDetailsPanel({
  attender,
  open,
  onOpenChange,
  customQuestions,
  isMobile,
}: AttenderDetailsPanelProps) {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{attender.name}</DrawerTitle>
            <DrawerDescription>Complete registration details</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <AttenderInfo attender={attender} customQuestions={customQuestions} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{attender.name}</DialogTitle>
          <DialogDescription>Complete registration details</DialogDescription>
        </DialogHeader>
        <AttenderInfo attender={attender} customQuestions={customQuestions} />
      </DialogContent>
    </Dialog>
  );
}
