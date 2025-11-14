
import { createClient, createServiceRoleClient } from '~/lib/supabase.server';
import { Route } from './+types/api.attenders-emails';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const userIds = url.searchParams.get('userIds');
  
  if (!userIds) {
    return Response.json({ error: 'userIds parameter is required' }, { status: 400 });
  }

  try {
    const userIdArray = JSON.parse(userIds) as string[];
    
    if (!Array.isArray(userIdArray) || userIdArray.length === 0) {
      return Response.json({ emails: {} });
    }

    // Use service role client to fetch emails
    const serviceClient = createServiceRoleClient();
    const emailMap: Record<string, string> = {};

    // Fetch users by IDs
    await Promise.all(
      userIdArray.map(async (userId) => {
        try {
          const { data: userData, error } = await serviceClient.auth.admin.getUserById(userId);
          if (!error && userData?.user?.email) {
            emailMap[userId] = userData.user.email;
          }
        } catch (err) {
          // Silently fail for individual users
          console.warn(`Failed to fetch email for user ${userId}:`, err);
        }
      })
    );

    return Response.json({ emails: emailMap });
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return Response.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

