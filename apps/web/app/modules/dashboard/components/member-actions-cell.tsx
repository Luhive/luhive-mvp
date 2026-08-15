import { IconShield, IconShieldOff, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import type { CommunityMemberRole } from "~/modules/dashboard/model/dashboard-types";

type MemberActionsCellProps = {
  memberId: string;
  fullName: string;
  role: CommunityMemberRole;
  canManageRoles: boolean;
  updatingMemberId: string | null;
  onRequestPromote: (memberId: string, fullName: string) => void;
  onRequestDemote: (memberId: string, fullName: string) => void;
};

export function MemberActionsCell({
  memberId,
  fullName,
  role,
  canManageRoles,
  updatingMemberId,
  onRequestPromote,
  onRequestDemote,
}: MemberActionsCellProps) {
  const isUpdating = updatingMemberId === memberId;

  return (
    <div className="flex justify-end gap-1">
      {canManageRoles && role === "member" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground bg-muted hover:text-primary hover:bg-muted hover:scale-110"
              disabled={isUpdating}
              onClick={() => onRequestPromote(memberId, fullName)}
            >
              <IconShield className="h-4 w-4" />
              <span className="sr-only">Make admin</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Make admin</TooltipContent>
        </Tooltip>
      )}

      {canManageRoles && role === "admin" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground bg-muted hover:text-amber-600 hover:bg-muted hover:scale-110"
              disabled={isUpdating}
              onClick={() => onRequestDemote(memberId, fullName)}
            >
              <IconShieldOff className="h-4 w-4" />
              <span className="sr-only">Remove admin</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove admin</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground bg-muted hover:text-destructive hover:bg-muted hover:scale-110"
            disabled={isUpdating}
            onClick={() => {
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
                loading: `Removing ${fullName}...`,
                success: `${fullName} has been removed`,
                error: "Failed to remove user",
              });
            }}
          >
            <IconTrash className="h-4 w-4" />
            <span className="sr-only">Delete user</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete user</TooltipContent>
      </Tooltip>
    </div>
  );
}
