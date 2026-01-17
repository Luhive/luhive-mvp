import { redirect } from 'react-router';
import { createClient } from '~/lib/supabase.server';
import { createOAuth2Client, getTokensFromCode, GOOGLE_FORMS_SCOPES } from '~/lib/google-forms.server';
import type { Route } from './+types/api.google-forms.callback';

/**
 * GET /api/google-forms/callback
 * OAuth callback handler - exchanges code for tokens and saves them
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);
  
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return redirect('/dashboard?google_forms_error=authorization_failed', { headers });
  }

  if (!code) {
    return redirect('/dashboard?google_forms_error=missing_code', { headers });
  }

  // Parse state parameter
  let userId: string | null = null;
  let returnTo = '/dashboard';
  
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
      returnTo = stateData.returnTo || '/dashboard';
    } catch (e) {
      console.error('Error parsing state:', e);
    }
  }

  // Verify user is still authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return redirect('/login?error=session_expired', { headers });
  }

  // Use the authenticated user's ID if state didn't provide one
  if (!userId) {
    userId = user.id;
  }

  // Verify the user ID matches
  if (userId !== user.id) {
    console.error('User ID mismatch in OAuth callback');
    return redirect('/dashboard?google_forms_error=user_mismatch', { headers });
  }

  try {
    // Exchange code for tokens
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    // Save tokens to database
    const { error: upsertError } = await supabase
      .from('google_forms_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: GOOGLE_FORMS_SCOPES.join(' '),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error saving tokens:', upsertError);
      return redirect(`${returnTo}?google_forms_error=save_failed`, { headers });
    }

    // Success - redirect back to forms page
    return redirect(`${returnTo}?google_forms_connected=true`, { headers });
  } catch (err) {
    console.error('Error in OAuth callback:', err);
    return redirect(`${returnTo}?google_forms_error=token_exchange_failed`, { headers });
  }
}
