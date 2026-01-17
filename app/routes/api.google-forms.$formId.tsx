import { createClient } from '~/lib/supabase.server';
import { 
  createOAuth2Client, 
  setCredentials, 
  getForm, 
  parseFormQuestions 
} from '~/lib/google-forms.server';
import type { Route } from './+types/api.google-forms.$formId';

/**
 * GET /api/google-forms/:formId
 * Get form details including questions
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const { formId } = params;

  if (!formId) {
    return Response.json(
      { error: 'Missing form ID' },
      { status: 400, headers }
    );
  }

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json(
      { error: 'Not authenticated' },
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
      return Response.json(
        { error: 'Google account not connected' },
        { status: 401, headers }
      );
    }

    // Create OAuth client with user's tokens
    const oauth2Client = createOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null
    });

    // Fetch form details
    const formData = await getForm(oauth2Client, formId);
    const questions = parseFormQuestions(formData);

    return Response.json({
      formId: formData.formId,
      info: formData.info,
      questions,
      revisionId: formData.revisionId,
      responderUri: formData.responderUri
    }, { headers });
  } catch (error: any) {
    console.error('Error getting form:', error);
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return Response.json(
        { error: 'token_expired', message: 'Your Google connection has expired' },
        { status: 401, headers }
      );
    }

    return Response.json(
      { error: 'Failed to get form', message: error.message },
      { status: 500, headers }
    );
  }
}
