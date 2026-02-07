import { useState, useEffect } from "react"
import { useLoaderData, useSearchParams, useNavigate, useNavigation } from "react-router"
import { createClient } from "~/lib/supabase.server"
import { 
  createOAuth2Client, 
  setCredentials, 
  listForms,
  type GoogleFormsToken 
} from "~/lib/google-forms.server"
import type { Route } from "./+types/$slug.forms"
import { useDashboardCommunity } from "~/hooks/use-dashboard-community"
import { DashboardFormsSkeleton } from "~/components/dashboard/dashboard-forms-skeleton"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { GoogleSignInModal } from "~/components/forms/google-sign-in-modal"
import { FormsList, type FormItem } from "~/components/forms/forms-list"
import { RefreshCw, Unlink, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface LoaderData {
  connected: boolean
  forms: FormItem[]
  error?: string
  communitySlug: string
}

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderData> {
  const { supabase } = createClient(request)
  const { slug } = params

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      connected: false,
      forms: [],
      error: 'Not authenticated',
      communitySlug: slug || ''
    }
  }

  try {
    // Get user's Google Forms tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_forms_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return {
        connected: false,
        forms: [],
        communitySlug: slug || ''
      }
    }

    // Create OAuth client with user's tokens
    const oauth2Client = createOAuth2Client()
    setCredentials(oauth2Client, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null
    })

    // Fetch forms from Google
    const forms = await listForms(oauth2Client)

    return {
      connected: true,
      forms: forms.map(form => ({
        id: form.id!,
        name: form.name!,
        createdTime: form.createdTime!,
        modifiedTime: form.modifiedTime!,
        webViewLink: form.webViewLink || undefined
      })),
      communitySlug: slug || ''
    }
  } catch (error: any) {
    console.error('Error loading forms:', error)
    
    // Check if token is expired/invalid
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return {
        connected: false,
        forms: [],
        error: 'token_expired',
        communitySlug: slug || ''
      }
    }

    return {
      connected: true,
      forms: [],
      error: error.message || 'Failed to load forms',
      communitySlug: slug || ''
    }
  }
}

export default function FormsPage() {
  const { data: dashboardData, loading: dashboardLoading } = useDashboardCommunity()
  const { connected, forms, error, communitySlug } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const navigation = useNavigation()
  
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  
  const isLoading = navigation.state === "loading" || dashboardLoading

  // Handle URL params for success/error messages
  useEffect(() => {
    const googleConnected = searchParams.get('google_forms_connected')
    const googleError = searchParams.get('google_forms_error')

    if (googleConnected === 'true') {
      toast.success('Google Forms connected successfully!')
      // Clear the URL params
      navigate(`/dashboard/${communitySlug}/forms`, { replace: true })
    }

    if (googleError) {
      const errorMessages: Record<string, string> = {
        'authorization_failed': 'Google authorization was denied',
        'missing_code': 'Authorization code missing',
        'user_mismatch': 'User verification failed',
        'save_failed': 'Failed to save connection',
        'token_exchange_failed': 'Failed to complete authorization'
      }
      toast.error(errorMessages[googleError] || 'An error occurred')
      navigate(`/dashboard/${communitySlug}/forms`, { replace: true })
    }
  }, [searchParams, navigate, communitySlug])

  // Show modal if not connected or token expired
  useEffect(() => {
    if (!connected || error === 'token_expired') {
      setShowSignInModal(true)
    }
  }, [connected, error])

  const handleRefresh = () => {
    setIsRefreshing(true)
    navigate(`/dashboard/${communitySlug}/forms`, { replace: true })
    // The page will reload with fresh data
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/google-forms/disconnect', {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Google Forms disconnected')
        navigate(`/dashboard/${communitySlug}/forms`, { replace: true })
      } else {
        toast.error('Failed to disconnect')
      }
    } catch (err) {
      toast.error('Failed to disconnect')
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Show skeleton while dashboard data is loading
  if (dashboardLoading || !dashboardData) {
    return <DashboardFormsSkeleton />;
  }

  // Show skeleton while forms are loading
  if (isLoading && forms.length === 0 && !error) {
    return <DashboardFormsSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Google Forms</h1>
          <p className="text-muted-foreground">
            View and manage responses from your Google Forms
          </p>
        </div>
        
        {connected && (
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && error !== 'token_expired' && connected && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading forms</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Connected State */}
      {!connected && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Connect Google Forms</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Connect your Google account to view and manage your Google Forms responses
          </p>
          <Button 
            className="mt-6 shadow-sm"
            onClick={() => setShowSignInModal(true)}
          >
            Connect Google Account
          </Button>
        </Card>
      )}

      {/* Forms List */}
      {connected && !error && (
        <FormsList forms={forms} communitySlug={communitySlug} />
      )}

      {/* Connection Stats */}
      {connected && forms.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {forms.length} form{forms.length !== 1 ? 's' : ''} from your Google account
        </div>
      )}

      {/* Google Sign In Modal */}
      <GoogleSignInModal 
        open={showSignInModal} 
        onOpenChange={setShowSignInModal}
        returnTo={`/dashboard/${communitySlug}/forms`}
      />
    </div>
  )
}
