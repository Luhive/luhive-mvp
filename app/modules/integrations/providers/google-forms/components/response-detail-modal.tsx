import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog"
import { Badge } from "~/shared/components/ui/badge"
import { Separator } from "~/shared/components/ui/separator"
import { ScrollArea } from "~/shared/components/ui/scroll-area"
import { Calendar, Clock, CheckCircle2, Circle, Type, Hash, List, AlignLeft } from "lucide-react"
import { format } from "date-fns"
import type { ParsedResponse, ParsedQuestion } from "~/modules/integrations/providers/google-forms/model/google-forms-types"

interface ResponseDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  response: ParsedResponse | null
  questions: ParsedQuestion[]
  formTitle?: string
}

const questionTypeIcons: Record<string, React.ReactNode> = {
  multiple_choice: <Circle className="h-4 w-4" />,
  checkbox: <CheckCircle2 className="h-4 w-4" />,
  dropdown: <List className="h-4 w-4" />,
  short_text: <Type className="h-4 w-4" />,
  paragraph: <AlignLeft className="h-4 w-4" />,
  scale: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
}

export function ResponseDetailModal({ 
  open, 
  onOpenChange, 
  response,
  questions,
  formTitle
}: ResponseDetailModalProps) {
  if (!response) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Response Details</DialogTitle>
          <DialogDescription className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(response.lastSubmittedTime), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(response.lastSubmittedTime), 'h:mm a')}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = response.answers[question.questionId]
              let displayValue = answer?.value
              
              // Handle array values for checkboxes
              const isArrayValue = Array.isArray(displayValue)
              
              return (
                <div key={question.questionId} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {questionTypeIcons[question.type] || <Type className="h-4 w-4" />}
                        </span>
                        <h4 className="font-medium leading-tight">{question.title}</h4>
                        {question.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      
                      <div className="ml-6 rounded-lg bg-muted/50 p-3">
                        {displayValue ? (
                          isArrayValue ? (
                            <div className="flex flex-wrap gap-2">
                              {(displayValue as string[]).map((val, i) => (
                                <Badge key={i} variant="outline" className="font-normal">
                                  {val}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{displayValue as string}</p>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No answer provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
