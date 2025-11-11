import { useState, useEffect } from 'react';
import { useRouteLoaderData } from 'react-router';
import type { DashboardLoaderData } from './layout';
import { EventList } from '~/components/events/event-list-admin';
import { createClient } from '~/lib/supabase.client';
import { toast } from 'sonner';
import type { Database } from '~/models/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export function meta() {
  return [
    { title: "Events - Dashboard" },
    { name: "description", content: "Manage your community events" },
  ];
}

export default function EventsPage() {
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout');
  const [events, setEvents] = useState<(Event & { registration_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentData?.community) return;

    const fetchEvents = async () => {
      const supabase = createClient();
      
      try {
        setLoading(true);

        // Fetch events for this community
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*')
          .eq('community_id', parentData.community.id)
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          toast.error('Failed to load events');
          setEvents([]);
          return;
        }

        // For each event, get registration count
        const eventsWithCounts = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { count } = await supabase
              .from('event_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            return {
              ...event,
              registration_count: count || 0,
            };
          })
        );

        setEvents(eventsWithCounts);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [parentData?.community]);

  if (!parentData) {
    return <div>Loading...</div>;
  }

  const { community } = parentData;

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('community_id', community.id);

      if (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
        return;
      }

      // Remove event from state
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <EventList
          events={events}
          communitySlug={community.slug}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}