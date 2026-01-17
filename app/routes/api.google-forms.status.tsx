import { createClient } from '~/lib/supabase.server';
import type { Route } from './+types/api.google-forms.status';

/**
 * GET /api/google-forms/status
 * Check if the user has connected their Google account for Forms access
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json(
      { connected: false, error: 'Not authenticated' },
      { status: 401, headers }
    );
  }

  try {
    // Check if user has Google Forms tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_forms_tokens')
      .select('id, expiry_date, updated_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { connected: false, message: 'Google account not connected' },
        { headers }
      );
    }

    // Check if token is expired
    const isExpired = tokenData.expiry_date && new Date(tokenData.expiry_date) < new Date();
    
    return Response.json({
      connected: true,
      isExpired,
      lastUpdated: tokenData.updated_at
    }, { headers });
  } catch (error) {
    console.error('Error checking Google Forms status:', error);
    return Response.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500, headers }
    );
  }
}
