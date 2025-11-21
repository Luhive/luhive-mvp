import { createServiceRoleClient } from '~/lib/supabase.server';
import type { Route } from './+types/api.attenders-list';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    return Response.json({ error: 'eventId parameter is required' }, { status: 400 });
  }

  try {
    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient();

    // Fetch event registrations with user profiles
    // Only show approved registrations (or null for legacy events without approval requirement)
    const { data: registrations, error } = await serviceClient
      .from('event_registrations')
      .select(`
        id,
        user_id,
        anonymous_name,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .eq('is_verified', true)
      .eq('rsvp_status', 'going')
      .or('approval_status.is.null,approval_status.eq.approved')
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendees:', error);
      return Response.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }

    // Transform data to attendee format
    const attendees = (registrations || [])
      .map((reg: any) => {
        const isAnonymous = !reg.user_id;
        const name = isAnonymous
          ? reg.anonymous_name || 'Anonymous'
          : reg.profiles?.full_name || 'Unknown User';

        return {
          id: reg.id,
          name,
          avatar_url: isAnonymous ? null : reg.profiles?.avatar_url || null,
        };
      })
      .filter((attendee: { name: string }) => attendee.name !== 'Unknown User');

    return Response.json({ attendees });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return Response.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
}

