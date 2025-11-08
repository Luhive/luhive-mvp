import { redirect } from 'react-router';

import { createClient } from '~/lib/supabase.server';
import { Route } from './+types/auth.verify';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);
  
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  
  if (token_hash && type === 'signup') {
    // Verify the email token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'signup',
    });

    if (!error && data.user) {
      // Get user metadata
      const referralCommunityId = data.user.user_metadata?.pending_community_id;
      
      // If they were trying to join a community, add them now
      if (referralCommunityId) {
        const {error} = await supabase
          .from('community_members')
          .insert({
            user_id: data.user.id,
            community_id: referralCommunityId,
            role: 'member',
          });

          console.error(error)
        
        // Get community slug for redirect
        const { data: community } = await supabase
          .from('communities')
          .select('slug')
          .eq('id', referralCommunityId)
          .single();
        
        if (community) {
          return redirect(`/c/${community.slug}?joined=true`, { headers });
        }
      }
      
      // Default redirect
      return redirect('/', { headers });
    }
  }
  
  return redirect('/login?error=verification-failed', { headers });
}