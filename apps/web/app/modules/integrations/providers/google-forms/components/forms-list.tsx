import * as React from "react"
import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/shared/components/ui/card"
import { Badge } from "~/shared/components/ui/badge"
import { FileText, ExternalLink, Clock, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export interface FormItem {
  id: string
  name: string
  createdTime: string
  modifiedTime: string
  webViewLink?: string
}

interface FormsListProps {
  forms: FormItem[]
  communitySlug: string
}

export function FormsList({ forms, communitySlug }: FormsListProps) {
  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No forms found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have any Google Forms yet. Create one in Google Forms to see it here.
        </p>
        <a 
          href="https://forms.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Create a form in Google Forms
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Link 
          key={form.id} 
          to={`/dashboard/${communitySlug}/forms/${form.id}`}
          className="group block"
        >
          <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                {form.webViewLink && (
                  <a
                    href={form.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground z-10 relative"
                    title="Open in Google Forms"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <CardTitle className="mt-3 line-clamp-2 text-base group-hover:text-primary transition-colors">
                {form.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {formatDistanceToNow(new Date(form.createdTime), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated {formatDistanceToNow(new Date(form.modifiedTime), { addSuffix: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
