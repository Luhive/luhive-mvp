import { createClient } from '~/lib/supabase.server';
import { createOAuth2Client, setCredentials, listForms } from '~/lib/google-forms.server';
import type { Route } from "./+types/list";

/**
 * GET /api/google-forms/list
 * List all Google Forms owned by the authenticated user
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
    // Get user's Google Forms tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_forms_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return Response.json({
        connected: false,
        forms: [],
        message: 'Please connect your Google account to view forms'
      }, { headers });
    }

    // Create OAuth client with user's tokens
    const oauth2Client = createOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null
    });

    // Fetch forms from Google
    const forms = await listForms(oauth2Client);

    return Response.json({
      connected: true,
      count: forms.length,
      forms: forms.map(form => ({
        id: form.id,
        name: form.name,
        createdTime: form.createdTime,
        modifiedTime: form.modifiedTime,
        webViewLink: form.webViewLink
      }))
    }, { headers });
  } catch (error: any) {
    console.error('Error listing forms:', error);
    
    // Check if it's an auth error (token expired/revoked)
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return Response.json({
        connected: false,
        error: 'token_expired',
        message: 'Your Google connection has expired. Please reconnect.'
      }, { status: 401, headers });
    }

    return Response.json(
      { error: 'Failed to list forms', message: error.message },
      { status: 500, headers }
    );
  }
}
