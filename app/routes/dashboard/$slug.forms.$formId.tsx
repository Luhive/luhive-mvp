import { useState } from "react"
import { useLoaderData, useNavigate, Link } from "react-router"
import { createClient } from "~/lib/supabase.server"
import { 
  createOAuth2Client, 
  setCredentials, 
  getForm,
  getFormResponses,
  parseFormQuestions,
  parseResponses,
  type ParsedQuestion,
  type ParsedResponse
} from "~/lib/google-forms.server"
import type { Route } from "./+types/$slug.forms.$formId"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { ResponsesTable } from "~/components/forms/responses-table"
import { ResponseDetailModal } from "~/components/forms/response-detail-modal"
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Users, 
  Calendar,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"

interface LoaderData {
  formId: string
  formTitle: string
  formDescription?: string
  responderUri?: string
  questions: ParsedQuestion[]
  responses: ParsedResponse[]
  totalResponses: number
  error?: string
  communitySlug: string
}

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderData> {
  const { supabase } = createClient(request)
  const { slug, formId } = params

  const defaultReturn = {
    formId: formId || '',
    formTitle: 'Form',
    questions: [],
    responses: [],
    totalResponses: 0,
    communitySlug: slug || ''
  }

  if (!formId) {
    return { ...defaultReturn, error: 'Form ID is required' }
  }

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { ...defaultReturn, error: 'Not authenticated' }
  }

  try {
    // Get user's Google Forms tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_forms_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return { ...defaultReturn, error: 'Google account not connected' }
    }

    // Create OAuth client with user's tokens
    const oauth2Client = createOAuth2Client()
    setCredentials(oauth2Client, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null
    })

    // Fetch form details and responses
    const formData = await getForm(oauth2Client, formId)
    const questions = parseFormQuestions(formData)
    const rawResponses = await getFormResponses(oauth2Client, formId)
    const responses = parseResponses(rawResponses, questions)

    return {
      formId,
      formTitle: formData.info?.title || 'Untitled Form',
      formDescription: formData.info?.description,
      responderUri: formData.responderUri,
      questions,
      responses,
      totalResponses: responses.length,
      communitySlug: slug || ''
    }
  } catch (error: any) {
    console.error('Error loading form responses:', error)
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return { ...defaultReturn, error: 'Your Google connection has expired. Please reconnect.' }
    }

    return { ...defaultReturn, error: error.message || 'Failed to load form' }
  }
}

export default function FormResponsesPage() {
  const { 
    formId, 
    formTitle, 
    formDescription,
    responderUri,
    questions, 
    responses, 
    totalResponses,
    error,
    communitySlug 
  } = useLoaderData<LoaderData>()
  
  const navigate = useNavigate()
  const [selectedResponse, setSelectedResponse] = useState<ParsedResponse | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    navigate(`/dashboard/${communitySlug}/forms/${formId}`, { replace: true })
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleViewResponse = (response: ParsedResponse) => {
    setSelectedResponse(response)
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          asChild
        >
          <Link to={`/dashboard/${communitySlug}/forms`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Link>
        </Button>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Form</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={() => navigate(`/dashboard/${communitySlug}/forms`)}>
              Return to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        asChild
      >
        <Link to={`/dashboard/${communitySlug}/forms`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{formTitle}</h1>
              {formDescription && (
                <p className="text-sm text-muted-foreground line-clamp-2">{formDescription}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {responderUri && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a href={responderUri} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Form
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Response</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.length > 0 
                ? format(new Date(responses[0].lastSubmittedTime), 'MMM d')
                : '-'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
          <CardDescription>
            Click on a response to view all answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsesTable 
            responses={responses}
            questions={questions}
            onViewResponse={handleViewResponse}
          />
        </CardContent>
      </Card>

      {/* Response Detail Modal */}
      <ResponseDetailModal
        open={!!selectedResponse}
        onOpenChange={(open) => !open && setSelectedResponse(null)}
        response={selectedResponse}
        questions={questions}
        formTitle={formTitle}
      />
    </div>
  )
}
