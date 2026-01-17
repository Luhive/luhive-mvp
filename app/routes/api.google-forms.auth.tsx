import { redirect } from 'react-router';
import { createClient } from '~/lib/supabase.server';
import { createOAuth2Client, getAuthUrl } from '~/lib/google-forms.server';
import type { Route } from './+types/api.google-forms.auth';

/**
 * GET /api/google-forms/auth
 * Initiates the Google OAuth flow for Forms API access
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json(
      { error: 'Not authenticated', message: 'Please log in first' },
      { status: 401, headers }
    );
  }

  try {
    // Get the return URL from query params (for redirect after OAuth)
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';
    
    // Create OAuth client and generate auth URL
    const oauth2Client = createOAuth2Client();
    
    // Encode user ID and return URL in state parameter
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id,
      returnTo 
    })).toString('base64');
    
    const authUrl = getAuthUrl(oauth2Client, state);
    
    return redirect(authUrl, { headers });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return Response.json(
      { error: 'OAuth initialization failed', message: (error as Error).message },
      { status: 500, headers }
    );
  }
}
