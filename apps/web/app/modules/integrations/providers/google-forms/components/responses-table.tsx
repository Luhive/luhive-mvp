import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shared/components/ui/table"
import { Button } from "~/shared/components/ui/button"
import { Eye, Clock } from "lucide-react"
import { format } from "date-fns"
import type { ParsedResponse, ParsedQuestion } from "~/modules/integrations/providers/google-forms/model/google-forms-types"

interface ResponsesTableProps {
  responses: ParsedResponse[]
  questions: ParsedQuestion[]
  onViewResponse: (response: ParsedResponse) => void
}

export function ResponsesTable({ responses, questions, onViewResponse }: ResponsesTableProps) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No responses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This form hasn't received any responses yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">#</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response, index) => (
            <TableRow 
              key={response.responseId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewResponse(response)}
            >
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {format(new Date(response.lastSubmittedTime), 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(response.lastSubmittedTime), 'h:mm a')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewResponse(response)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
