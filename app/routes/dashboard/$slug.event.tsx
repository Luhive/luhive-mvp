import { useState, useEffect } from 'react';
import { EventList } from '~/components/events/event-list-admin';
import { toast } from 'sonner';
import type { Database } from '~/models/database.types';
import { deleteEventClient, getEventsWithRegistrationCountsClient, updateEventStatusClient } from '~/services/events.service';
import { useDashboardCommunity } from '~/hooks/use-dashboard-community';
import { DashboardEventsListSkeleton } from '~/components/dashboard/dashboard-events-list-skeleton';

type Event = Database['public']['Tables']['events']['Row'];

export function meta() {
  return [
    { title: "Events - Dashboard" },
    { name: "description", content: "Manage your community events" },
  ];
}

export default function EventsPage() {
  const { data, loading: dashboardLoading } = useDashboardCommunity();
  const [events, setEvents] = useState<(Event & { registration_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data?.community) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);

        const { events, error } = await getEventsWithRegistrationCountsClient(data.community.id);

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
  }, [data?.community]);

  if (dashboardLoading || !data) {
    return <DashboardEventsListSkeleton />;
  }

  const { community } = data;

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

  const handleStatusChange = async (eventId: string, newStatus: 'draft' | 'published') => {
    try {
      const { error } = await updateEventStatusClient(eventId, community.id, newStatus);

      if (error) {
        console.error('Error updating event status:', error);
        toast.error('Failed to update event status');
        return;
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
      );

      toast.success(
        newStatus === 'published'
          ? 'Event published successfully'
          : 'Event moved to drafts successfully'
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update event status');
    }
  };

  if (loading) {
    return <DashboardEventsListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <EventList
          events={events}
          communitySlug={community.slug}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}