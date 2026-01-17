import { createClient } from '~/lib/supabase.server';
import type { Route } from './+types/api.google-forms.disconnect';

/**
 * POST /api/google-forms/disconnect
 * Disconnect Google Forms - removes stored tokens
 */
export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json(
      { error: 'Not authenticated' },
      { status: 401, headers }
    );
  }

  try {
    // Delete user's Google Forms tokens
    const { error: deleteError } = await supabase
      .from('google_forms_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting tokens:', deleteError);
      return Response.json(
        { error: 'Failed to disconnect', message: deleteError.message },
        { status: 500, headers }
      );
    }

    return Response.json({
      success: true,
      message: 'Google account disconnected successfully'
    }, { headers });
  } catch (error: any) {
    console.error('Error disconnecting Google:', error);
    return Response.json(
      { error: 'Failed to disconnect', message: error.message },
      { status: 500, headers }
    );
  }
}
