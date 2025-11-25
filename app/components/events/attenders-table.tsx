import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  Row,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";
import {
  IconChevronRight,
  IconTrash,
  IconMail,
  IconPhone,
  IconCheck,
  IconX,
  IconFilter,
} from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Filter, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { createClient } from "~/lib/supabase.client";
import type { Database } from "~/models/database.types";
import { useEffect, useState } from "react";
import { AttendersTableSkeleton } from "./attenders-table-skeleton";
import { RegistrationAnswersDisplay } from "./registration-answers-display";
import { utils, writeFile } from "xlsx";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";
import { useFetcher } from "react-router";
import type { CustomQuestionJson, CustomAnswerJson } from "~/models/event.types";
import { getCSVHeaders, flattenCustomAnswers } from "~/lib/utils/customQuestions";

import ExcelIcon from "~/assets/images/ExcelLogo.png";

type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];

type RSVPStatus = Database["public"]["Enums"]["rsvp_status"];
type ApprovalStatus = Database["public"]["Enums"]["event_approval_statuses"];

// Schema for attenders
export const attenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  rsvp_status: z.enum(["going", "not_going", "maybe"]),
  approval_status: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
  is_verified: z.boolean(),
  registered_at: z.string().nullable(),
  is_anonymous: z.boolean(),
  custom_answers: z.any().nullable().optional(),
});

type Attender = z.infer<typeof attenderSchema>;

const rsvpStatusConfig: Record<
  RSVPStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  going: { label: "Going", variant: "default" },
  not_going: { label: "Not Going", variant: "destructive" },
  maybe: { label: "Maybe", variant: "secondary" },
};

const approvalStatusConfig: Record<
  ApprovalStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "warning"; // Added warning conceptually
    className?: string;
  }
  > = {
  approved: { label: "Approved", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Rejected", variant: "destructive", className: "bg-red-400/50 hover:bg-red-400/60 text-red-800" },
  pending: { label: "Pending", variant: "secondary", className: "bg-amber-500 hover:bg-amber-600 text-white" },
};

interface AttendersTableProps {
  eventId: string;
}

export function AttendersTable({ eventId }: AttendersTableProps) {
  const [data, setData] = useState<Attender[]>([]);
  const [loading, setLoading] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestionJson | null>(null);
  const [selectedAttender, setSelectedAttender] = useState<Attender | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [attenderToDelete, setAttenderToDelete] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isMobile = useIsMobile();
  const fetcher = useFetcher();

  // Fetch attenders client-side
  const fetchAttenders = React.useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      // Only set loading on initial fetch if data is empty
      if (data.length === 0) setLoading(true);

      const supabase = createClient();

      // Fetch event to get custom_questions
      const { data: eventData } = await supabase
        .from("events")
        .select("custom_questions")
        .eq("id", eventId)
        .single();

      if (eventData?.custom_questions) {
        setCustomQuestions(eventData.custom_questions as CustomQuestionJson);
      }

      // Fetch event registrations with user profiles
      const { data: registrations, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          user_id,
          anonymous_name,
          anonymous_email,
          anonymous_phone,
          rsvp_status,
          approval_status,
          is_verified,
          registered_at,
          custom_answers,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });

      if (error) {
        console.error("Error fetching registrations:", error);
        toast.error("Failed to load attenders");
        setData([]);
        setLoading(false);
        return;
      }

      // Get all unique user_ids from authenticated registrations
      const authenticatedUserIds = (registrations || [])
        .filter((reg: any) => reg.user_id)
        .map((reg: any) => reg.user_id);

      // Fetch emails for authenticated users from API route
      const userEmailsMap = new Map<string, string>();
      if (authenticatedUserIds.length > 0) {
        try {
          const response = await fetch(`/api/attenders-emails?userIds=${encodeURIComponent(JSON.stringify(authenticatedUserIds))}`);
          if (response.ok) {
            const { emails } = await response.json();
            // emails is an object: { userId: "email" }
            Object.entries(emails || {}).forEach(([userId, email]) => {
              userEmailsMap.set(userId, email as string);
            });
          }
        } catch (e) {
          console.error("Failed to fetch emails", e);
        }
      }

      const formattedData: Attender[] = registrations.map((reg: any) => {
        const isAnonymous = !reg.user_id;
        // Get phone from custom_answers if available, otherwise use anonymous_phone
        const phoneFromAnswers = (reg.custom_answers as CustomAnswerJson)?.phone;
        return {
          id: reg.id,
          name: isAnonymous
            ? reg.anonymous_name || "Anonymous"
            : reg.profiles?.full_name || "Unknown User",
          email: isAnonymous
            ? reg.anonymous_email
            : reg.user_id ? userEmailsMap.get(reg.user_id) : null,
          phone: phoneFromAnswers || reg.anonymous_phone,
          avatar_url: reg.profiles?.avatar_url,
          rsvp_status: reg.rsvp_status,
          approval_status: reg.approval_status || "approved", // Default to approved if null (legacy)
          is_verified: reg.is_verified,
          registered_at: reg.registered_at,
          is_anonymous: isAnonymous,
          custom_answers: reg.custom_answers,
        };
      });

      setData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  }, [eventId]); // Removed data dependency to avoid loop, managed by useEffect

  useEffect(() => {
    fetchAttenders();
  }, [fetchAttenders]);

  const handleDeleteClick = (id: string, name: string) => {
    setAttenderToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleShowAttenderDetails = (attender: Attender) => {
    setSelectedAttender(attender);
    setDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attenderToDelete) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", attenderToDelete.id)
        .eq("event_id", eventId);

      if (error) {
        console.error("Error deleting registration:", error);
        toast.error("Failed to remove attender");
        setIsDeleting(false);
        return;
      }

      toast.success(`${attenderToDelete.name} has been removed from the event`);
      setDeleteDialogOpen(false);
      setAttenderToDelete(null);
      setIsDeleting(false);
      // Remove from local state
      setData((prev) => prev.filter((a) => a.id !== attenderToDelete.id));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to remove attender");
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    const formData = new FormData();
    formData.append("registrationId", id);
    formData.append("eventId", eventId);
    formData.append("status", status);

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/update-registration-status"
    });

    // Optimistic update
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, approval_status: status } : item
    ));

    // toast.info(`Updating status to ${status}...`);
  };

  // Monitor fetcher response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Status updated successfully");
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
        // Revert on error? For now, we can just reload
        fetchAttenders();
      }
    }
  }, [fetcher.state, fetcher.data, fetchAttenders]);

  const handleExportToExcel = React.useCallback(async () => {
    const supabase = createClient();

    // Fetch full registration data for export
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId);

    if (!registrations) return;

    // Get custom question headers
    const customHeaders = customQuestions ? getCSVHeaders(customQuestions) : [];

    const exportData = data.map((row) => {
      const registration = registrations.find((r: any) => r.id === row.id);
      const baseData: Record<string, string> = {
        Name: row.name,
        Type: row.is_anonymous ? "Anonymous" : "Member",
        Email: row.email || "-",
        Phone: row.phone || "-",
        "RSVP Status": rsvpStatusConfig[row.rsvp_status]?.label || row.rsvp_status,
        "Approval Status": row.approval_status ? approvalStatusConfig[row.approval_status as ApprovalStatus]?.label : "Approved",
        Verified: row.is_verified ? "Yes" : "No",
        "Registered At": row.registered_at
          ? new Date(row.registered_at).toLocaleString()
          : "-",
      };

      // Add custom question answers if available
      if (registration && customQuestions) {
        const flattened = flattenCustomAnswers(registration as EventRegistration, customQuestions);
        Object.assign(baseData, flattened);
      }

      return baseData;
    });

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Attenders");
    writeFile(wb, "event-attenders.xlsx");
  }, [data, eventId, customQuestions]);

  const columns = React.useMemo<ColumnDef<Attender>[]>(
    () => [
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
        header: "Attender",
        cell: ({ row }) => (
          <button
            onClick={() => handleShowAttenderDetails(row.original)}
            className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={row.original.avatar_url || ""}
                alt={row.original.name}
              />
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
          const status = (row.original.approval_status || "approved") as ApprovalStatus;
          const config = approvalStatusConfig[status];
          return (
            <Badge
              variant="outline"
              className={cn("border-transparent font-medium", config?.className, status === 'approved' && "bg-green-100 text-green-700 hover:bg-green-200 border-green-200")}
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
        header: "Registered",
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
          const isPending = attender.approval_status === 'pending';

          return (
            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleStatusUpdate(attender.id, 'approved')}
                    title="Approve"
                  >
                    <IconCheck className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleStatusUpdate(attender.id, 'rejected')}
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
                      onClick={() =>
                        (window.location.href = `mailto:${attender.email}`)
                      }
                    >
                      Email Attender
                    </DropdownMenuCheckboxItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    onClick={() => handleShowAttenderDetails(attender)}
                  >
                    Show Answers
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {!isPending && attender.approval_status !== 'approved' && (
                    <DropdownMenuCheckboxItem
                      onClick={() => handleStatusUpdate(attender.id, 'approved')}
                      className="text-green-600"
                    >
                      Approve Registration
                    </DropdownMenuCheckboxItem>
                  )}
                  {!isPending && attender.approval_status !== 'rejected' && (
                    <DropdownMenuCheckboxItem
                      onClick={() => handleStatusUpdate(attender.id, 'rejected')}
                      className="text-red-600"
                    >
                      Reject Registration
                    </DropdownMenuCheckboxItem>
                  )}
                  <DropdownMenuCheckboxItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteClick(attender.id, attender.name)}
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
    ],
    [handleDeleteClick]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <AttendersTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Search & Filters */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="w-full sm:w-[300px]">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filter attenders..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
            />
          </InputGroup>

          {/* Status Filter */}
          <Select
            value={(table.getColumn("approval_status")?.getFilterValue() as string[])?.[0] || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn("approval_status")?.setFilterValue(undefined);
              } else {
                table.getColumn("approval_status")?.setFilterValue([value]);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <IconFilter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto sm:ml-0">
                Columns <IconChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => {
              // Bulk delete not implemented yet
              toast.info("Bulk actions coming soon");
            }}>
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <img src={ExcelIcon} alt="Excel" className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                    className="h-24 text-center"
                >
                    No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Attender
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {attenderToDelete?.name}
              </span>{" "}
              from the event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attender Details Drawer/Dialog */}
      {selectedAttender && (
        isMobile ? (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{selectedAttender.name}</DrawerTitle>
                <DrawerDescription>
                  Complete registration details
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 overflow-y-auto space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedAttender.avatar_url || ""}
                        alt={selectedAttender.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedAttender.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{selectedAttender.name}</div>
                      {selectedAttender.is_anonymous && (
                        <Badge variant="secondary" className="mt-1">Anonymous</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium">{selectedAttender.email || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">{selectedAttender.phone || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">RSVP Status</span>
                      <Badge variant={rsvpStatusConfig[selectedAttender.rsvp_status].variant}>
                        {rsvpStatusConfig[selectedAttender.rsvp_status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approval Status</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent font-medium",
                          approvalStatusConfig[selectedAttender.approval_status as ApprovalStatus]?.className,
                          selectedAttender.approval_status === 'approved' && "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                        )}
                      >
                        {approvalStatusConfig[selectedAttender.approval_status as ApprovalStatus]?.label || "Approved"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      <Badge variant={selectedAttender.is_verified ? "default" : "outline"}>
                        {selectedAttender.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registered At</span>
                      <span className="text-sm font-medium">
                        {selectedAttender.registered_at
                          ? new Date(selectedAttender.registered_at).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Answers */}
                {(customQuestions && selectedAttender.custom_answers) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Custom Answers</h3>
                      <RegistrationAnswersDisplay
                        answers={selectedAttender.custom_answers as CustomAnswerJson | null}
                        questions={customQuestions}
                      />
                    </div>
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedAttender.name}</DialogTitle>
                <DialogDescription>
                  Complete registration details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedAttender.avatar_url || ""}
                        alt={selectedAttender.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedAttender.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{selectedAttender.name}</div>
                      {selectedAttender.is_anonymous && (
                        <Badge variant="secondary" className="mt-1">Anonymous</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium">{selectedAttender.email || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">{selectedAttender.phone || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">RSVP Status</span>
                      <Badge variant={rsvpStatusConfig[selectedAttender.rsvp_status].variant}>
                        {rsvpStatusConfig[selectedAttender.rsvp_status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approval Status</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent font-medium",
                          approvalStatusConfig[selectedAttender.approval_status as ApprovalStatus]?.className,
                          selectedAttender.approval_status === 'approved' && "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                        )}
                      >
                        {approvalStatusConfig[selectedAttender.approval_status as ApprovalStatus]?.label || "Approved"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      <Badge variant={selectedAttender.is_verified ? "default" : "outline"}>
                        {selectedAttender.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registered At</span>
                      <span className="text-sm font-medium">
                        {selectedAttender.registered_at
                          ? new Date(selectedAttender.registered_at).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Answers */}
                {(customQuestions && selectedAttender.custom_answers) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Custom Answers</h3>
                      <RegistrationAnswersDisplay
                        answers={selectedAttender.custom_answers as CustomAnswerJson | null}
                        questions={customQuestions}
                      />
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )
      )}
    </div>
  );
}
