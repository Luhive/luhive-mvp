import { useState, useEffect } from 'react';
import { useRouteLoaderData } from 'react-router';
import type { DashboardLoaderData } from './layout';
import { EventList } from '~/components/events/event-list-admin';
import { toast } from 'sonner';
import type { Database } from '~/models/database.types';
import { deleteEventClient, getEventsWithRegistrationCountsClient } from '~/services/events.service';

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
      try {
        setLoading(true);

        const { events, error } = await getEventsWithRegistrationCountsClient(parentData.community.id);

        if (error) {
          console.error('Error fetching events:', error);
          toast.error('Failed to load events');
          setEvents([]);
          return;
        }

        setEvents(events);
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

    try {
      const { error } = await deleteEventClient(eventId, community.id);

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
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <EventList
          events={events}
          communitySlug={community.slug}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}