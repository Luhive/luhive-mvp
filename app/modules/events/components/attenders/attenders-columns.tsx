import type { ColumnDef } from "@tanstack/react-table";
import {
  IconTrash,
  IconMail,
  IconPhone,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "~/shared/components/ui/badge";
import { Button } from "~/shared/components/ui/button";
import { Checkbox } from "~/shared/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/shared/components/ui/dropdown-menu";
import { cn } from "~/shared/lib/utils";
import type { Attender } from "~/modules/events/model/attender.types";
import { rsvpStatusConfig, approvalStatusConfig } from "~/modules/events/model/attender.types";
import type { EventApprovalStatus } from "~/shared/models/entity.types";

interface AttendersColumnsOptions {
  isExternalEvent: boolean;
  onShowDetails: (attender: Attender) => void;
  onDeleteClick: (id: string, name: string) => void;
  onStatusUpdate: (id: string, status: "approved" | "rejected") => void;
}

export function createAttendersColumns({
  isExternalEvent,
  onShowDetails,
  onDeleteClick,
  onStatusUpdate,
}: AttendersColumnsOptions): ColumnDef<Attender>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: isExternalEvent ? "Subscriber" : "Attender",
      cell: ({ row }) => (
        <button
          onClick={() => onShowDetails(row.original)}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar_url || ""} alt={row.original.name} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {row.original.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium">{row.original.name}</div>
            {row.original.is_anonymous && (
              <span className="text-xs text-muted-foreground">Anonymous</span>
            )}
          </div>
        </button>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email && (
            <div className="flex items-center gap-2 text-sm">
              <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-2 text-sm">
              <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{row.original.phone}</span>
            </div>
          )}
          {!row.original.email && !row.original.phone && (
            <span className="text-sm text-muted-foreground">No contact info</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "approval_status",
      header: "Approved",
      cell: ({ row }) => {
        const status = (row.original.approval_status || "approved") as EventApprovalStatus;
        const config = approvalStatusConfig[status];
        return (
          <Badge
            variant="outline"
            className={cn(
              "border-transparent font-medium",
              config?.className,
              status === "approved" &&
                "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
            )}
          >
            {config?.label || status}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "rsvp_status",
      header: "RSVP",
      cell: ({ row }) => {
        const status = row.original.rsvp_status;
        const config = rsvpStatusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "is_verified",
      header: "Verified",
      cell: ({ row }) => (
        <Badge variant={row.original.is_verified ? "default" : "outline"}>
          {row.original.is_verified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "registered_at",
      header: isExternalEvent ? "Subscribed" : "Registered",
      cell: ({ row }) => {
        if (!row.original.registered_at)
          return <span className="text-muted-foreground">-</span>;
        const date = new Date(row.original.registered_at);
        return (
          <div className="text-muted-foreground text-sm">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const attender = row.original;
        const isPending = attender.approval_status === "pending";

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onStatusUpdate(attender.id, "approved")}
                  title="Approve"
                >
                  <IconCheck className="h-4 w-4" />
                  <span className="sr-only">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onStatusUpdate(attender.id, "rejected")}
                  title="Reject"
                >
                  <IconX className="h-4 w-4" />
                  <span className="sr-only">Reject</span>
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  onClick={() => navigator.clipboard.writeText(attender.id)}
                >
                  Copy ID
                </DropdownMenuCheckboxItem>
                {attender.email && (
                  <DropdownMenuCheckboxItem
                    onClick={() => (window.location.href = `mailto:${attender.email}`)}
                  >
                    Email Attender
                  </DropdownMenuCheckboxItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem onClick={() => onShowDetails(attender)}>
                  Show Answers
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {!isPending && attender.approval_status !== "approved" && (
                  <DropdownMenuCheckboxItem
                    onClick={() => onStatusUpdate(attender.id, "approved")}
                    className="text-green-600"
                  >
                    Approve Registration
                  </DropdownMenuCheckboxItem>
                )}
                {!isPending && attender.approval_status !== "rejected" && (
                  <DropdownMenuCheckboxItem
                    onClick={() => onStatusUpdate(attender.id, "rejected")}
                    className="text-red-600"
                  >
                    Reject Registration
                  </DropdownMenuCheckboxItem>
                )}
                <DropdownMenuCheckboxItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteClick(attender.id, attender.name)}
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
