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
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconTrash,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { createClient } from "~/lib/supabase.client";
import type { Database } from "~/models/database.types";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { AttendersTableSkeleton } from "./attenders-table-skeleton";

type RSVPStatus = Database["public"]["Enums"]["rsvp_status"];

// Schema for attenders
export const attenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  rsvp_status: z.enum(["going", "not_going", "maybe"]),
  is_verified: z.boolean(),
  registered_at: z.string().nullable(),
  is_anonymous: z.boolean(),
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

// Column definitions for attenders table
const createColumns = (
  eventId: string,
  onDelete: (id: string, name: string) => void
): ColumnDef<Attender>[] => [
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
      <div className="flex items-center gap-3">
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

          {!row.original.is_anonymous && (
            <span className="text-xs text-muted-foreground">User</span>
          )}
        </div>
      </div>
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
    accessorKey: "rsvp_status",
    header: "RSVP Status",
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
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground bg-muted hover:text-destructive hover:bg-muted hover:scale-110"
            onClick={() => onDelete(row.original.id, row.original.name)}
          >
            <IconTrash className="h-4 w-4" />
            <span className="sr-only">Remove attender</span>
          </Button>
        </div>
      );
    },
  },
];

interface AttendersTableProps {
  eventId: string;
}

export function AttendersTable({ eventId }: AttendersTableProps) {
  const [data, setData] = useState<Attender[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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

  // Fetch attenders client-side
  useEffect(() => {
    const fetchAttenders = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();

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
            is_verified,
            registered_at,
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
            const response = await fetch(
              `/api/attenders-emails?userIds=${encodeURIComponent(JSON.stringify(authenticatedUserIds))}`
            );
            if (response.ok) {
              const { emails } = await response.json();
              Object.entries(emails || {}).forEach(([userId, email]) => {
                userEmailsMap.set(userId, email as string);
              });
            }
          } catch (err) {
            console.warn("Failed to fetch user emails:", err);
            // Continue without emails
          }
        }

        // Transform data to match Attender type
        const attenders: Attender[] = (registrations || []).map((reg: any) => {
          const isAnonymous = !reg.user_id;
          const userEmail = isAnonymous
            ? null
            : userEmailsMap.get(reg.user_id) || null;

          return {
            id: reg.id,
            name: isAnonymous
              ? reg.anonymous_name || "Anonymous"
              : reg.profiles?.full_name || "Unknown User",
            email: isAnonymous ? reg.anonymous_email : userEmail,
            phone: isAnonymous ? reg.anonymous_phone : null,
            avatar_url: isAnonymous ? null : reg.profiles?.avatar_url || null,
            rsvp_status: reg.rsvp_status,
            is_verified: reg.is_verified,
            registered_at: reg.registered_at,
            is_anonymous: isAnonymous,
          };
        });

        setData(attenders);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load attenders");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttenders();
  }, [eventId]);

  const handleDeleteClick = React.useCallback((id: string, name: string) => {
    setAttenderToDelete({ id, name });
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
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
      // Remove from local state and refresh
      setData((prev) => prev.filter((a) => a.id !== attenderToDelete.id));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to remove attender");
      setIsDeleting(false);
    }
  }, [attenderToDelete, eventId]);

  const columns = React.useMemo(
    () => createColumns(eventId, handleDeleteClick),
    [eventId, handleDeleteClick]
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

  // RSVP status counts
  const goingCount = data.filter((a) => a.rsvp_status === "going").length;
  const notGoingCount = data.filter(
    (a) => a.rsvp_status === "not_going"
  ).length;
  const maybeCount = data.filter((a) => a.rsvp_status === "maybe").length;

  if (loading) {
    return <AttendersTableSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Attenders List
            </h2>
            <p className="text-sm text-muted-foreground">
              {data.length} total registration{data.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{goingCount} Going</Badge>
            <Badge variant="secondary">{maybeCount} Maybe</Badge>
            <Badge variant="destructive">{notGoingCount} Not Going</Badge>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="pl-10 w-80"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No attenders registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} attender(s) selected.
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle>Remove Attender</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{attenderToDelete?.name}</span>{" "}
              from this event?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              They will no longer be registered for this event and will not
              receive any event updates.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAttenderToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Removing...
                </>
              ) : (
                "Remove Attender"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
