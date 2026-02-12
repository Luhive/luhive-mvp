import { redirect } from 'react-router';

import { createClient } from '~/lib/supabase.server';
import { Route } from "./+types/verify";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);
  
  // Handle OAuth callback
  const code = url.searchParams.get('code');
  if (code) {
    // Get pending community ID from cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const pendingCommunityIdMatch = cookieHeader.match(/pending_community_id=([^;]+)/);
    const pendingCommunityId = pendingCommunityIdMatch ? pendingCommunityIdMatch[1] : null;

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect('/login?error=oauth-failed', { headers });
    }

    if (data.user) {
      // Clear the pending community cookie
      if (pendingCommunityId) {
        headers.append(
          'Set-Cookie',
          `pending_community_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );
      }

      // Check if user needs a profile created
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile for OAuth user
        const fullName = data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          `${data.user.user_metadata?.given_name || ''} ${data.user.user_metadata?.family_name || ''}`.trim() ||
          data.user.email?.split('@')[0] || 'User';

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            metadata: pendingCommunityId ? {
              referral_community_id: pendingCommunityId
            } : undefined
          });

        if (profileError) {
          console.error('Failed to create profile:', profileError);
        }

        // If they were trying to join a community, add them now
        if (pendingCommunityId) {
          const { error: memberError } = await supabase
            .from('community_members')
            .insert({
              user_id: data.user.id,
              community_id: pendingCommunityId,
              role: 'member',
            });

          if (!memberError) {
            // Get community slug for redirect
            const { data: community } = await supabase
              .from('communities')
              .select('slug')
              .eq('id', pendingCommunityId)
              .single();

            if (community) {
              return redirect(`/c/${community.slug}?joined=true`, { headers });
            }
          }
        }
      } else {
        // Existing user - check if they have a community to join
        if (pendingCommunityId) {
          // Check if already a member
          const { data: existingMember } = await supabase
            .from('community_members')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('community_id', pendingCommunityId)
            .single();

          if (!existingMember) {
            const { error: memberError } = await supabase
              .from('community_members')
              .insert({
                user_id: data.user.id,
                community_id: pendingCommunityId,
                role: 'member',
              });

            if (!memberError) {
              const { data: community } = await supabase
                .from('communities')
                .select('slug')
                .eq('id', pendingCommunityId)
                .single();

              if (community) {
                return redirect(`/c/${community.slug}?joined=true`, { headers });
              }
            }
          }
        }
      }

      // Check if user has a community they created
      const { data: community } = await supabase
        .from('communities')
        .select('slug')
        .eq('created_by', data.user.id)
        .single();

      if (community) {
        return redirect(`/c/${community.slug}`, { headers });
      }

      // Default redirect
      return redirect('/', { headers });
    }
  }

  // Handle email verification
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