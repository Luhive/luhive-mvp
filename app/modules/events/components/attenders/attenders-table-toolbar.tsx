import { Search } from "lucide-react";
import {
  IconChevronRight,
  IconFilter,
} from "@tabler/icons-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "~/shared/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/shared/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import ExcelIcon from "~/assets/images/ExcelLogo.png";
import type { Attender } from "~/modules/events/model/attender.types";

interface AttendersTableToolbarProps {
  table: Table<Attender>;
  rowSelection: Record<string, boolean>;
  isExternalEvent: boolean;
  onExport: () => void;
}

export function AttendersTableToolbar({
  table,
  rowSelection,
  isExternalEvent,
  onExport,
}: AttendersTableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left Side: Search & Filters */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="w-full sm:w-[300px]">
          <InputGroupAddon>
            <Search className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={isExternalEvent ? "Filter subscribers..." : "Filter attenders..."}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
          />
        </InputGroup>

        {/* Status Filter */}
        <Select
          value={
            (table.getColumn("approval_status")?.getFilterValue() as string[])?.[0] || "all"
          }
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

        {/* Column Visibility Toggle */}
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
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id.replace("_", " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-2">
        {Object.keys(rowSelection).length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => toast.info("Bulk actions coming soon")}
          >
            Delete Selected ({Object.keys(rowSelection).length})
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onExport}>
          <img src={ExcelIcon} alt="Excel" className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
