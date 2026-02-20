import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "~/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shared/components/ui/table";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { useState } from "react";
import { AttendersTableSkeleton } from "~/modules/events/components/attenders/attenders-table-skeleton";
import { useAttenders } from "~/modules/events/hooks/use-attenders";
import { createAttendersColumns } from "~/modules/events/components/attenders/attenders-columns";
import { AttendersTableToolbar } from "~/modules/events/components/attenders/attenders-table-toolbar";
import { AttenderDeleteDialog } from "~/modules/events/components/attenders/attender-delete-dialog";
import { AttenderDetailsPanel } from "~/modules/events/components/attenders/attender-details-panel";
import type { Attender } from "~/modules/events/model/attender.types";

interface AttendersTableProps {
  eventId: string;
  isExternalEvent?: boolean;
}

export function AttendersTable({ eventId, isExternalEvent = false }: AttendersTableProps) {
  const {
    data,
    loading,
    customQuestions,
    deleteDialogOpen,
    setDeleteDialogOpen,
    attenderToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleStatusUpdate,
    handleExportToExcel,
  } = useAttenders({ eventId, isExternalEvent });

  const [selectedAttender, setSelectedAttender] = useState<Attender | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const isMobile = useIsMobile();

  const handleShowAttenderDetails = (attender: Attender) => {
    setSelectedAttender(attender);
    setDetailsOpen(true);
  };

  const columns = React.useMemo(
    () =>
      createAttendersColumns({
        isExternalEvent,
        onShowDetails: handleShowAttenderDetails,
        onDeleteClick: handleDeleteClick,
        onStatusUpdate: handleStatusUpdate,
      }),
    [isExternalEvent, handleDeleteClick, handleStatusUpdate],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
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
      <AttendersTableToolbar
        table={table}
        rowSelection={rowSelection}
        isExternalEvent={isExternalEvent}
        onExport={handleExportToExcel}
      />

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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

      <AttenderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        attenderName={attenderToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {selectedAttender && (
        <AttenderDetailsPanel
          attender={selectedAttender}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          customQuestions={customQuestions}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
