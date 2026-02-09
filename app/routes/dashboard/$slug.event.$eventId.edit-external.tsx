import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import type { Database } from '~/models/database.types';
import type { DashboardLoaderData } from '~/routes/dashboard/layout';
import { DashboardEventFormSkeleton } from '~/components/dashboard/dashboard-event-form-skeleton';
import { ExternalEventForm } from '~/components/events/external-event-form';
import { getEventByIdClient } from '~/services/events.service';
import type { ExternalPlatform } from '~/models/event.types';

dayjs.extend(utc);
dayjs.extend(timezone);

type Event = Database['public']['Tables']['events']['Row'];

export function meta() {
  return [
    { title: 'Edit External Event - Dashboard' },
    { name: 'description', content: 'Edit an existing external community event' },
  ];
}

export default function EditExternalEventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { dashboardData } = useOutletContext<{ dashboardData: DashboardLoaderData }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dashboardData?.community || !eventId) return;

    let cancelled = false;

    async function fetchEvent() {
      try {
        setLoading(true);

        const { event, error } = await getEventByIdClient(eventId, dashboardData.community.id);

        if (cancelled) return;

        if (error || !event) {
          console.error('Error fetching event:', error);
          toast.error('Failed to load event');
          navigate(`/dashboard/${dashboardData.community.slug}/events`);
          return;
        }

        // If this is not an external event, redirect to the standard edit page
        if (event.registration_type !== 'external') {
          navigate(
            `/dashboard/${dashboardData.community.slug}/events/${event.id}/edit`,
            { replace: true },
          );
          return;
        }

        setEvent(event);
      } catch (error) {
        if (cancelled) return;
        console.error('Error:', error);
        toast.error('Failed to load event');
        navigate(`/dashboard/${dashboardData.community.slug}/events`);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvent();

    return () => {
      cancelled = true;
    };
  }, [dashboardData?.community, eventId, navigate]);

  if (!dashboardData) {
    return <DashboardEventFormSkeleton />;
  }

  if (loading || !event) {
    return <DashboardEventFormSkeleton />;
  }

  const eventStart = dayjs(event.start_time).tz(event.timezone);
  const startDate = event.start_time ? eventStart.toDate() : undefined;
  const startTime = event.start_time ? eventStart.format('HH:mm') : '09:00';

  const eventEnd = event.end_time ? dayjs(event.end_time).tz(event.timezone) : null;
  const endTime = eventEnd ? eventEnd.format('HH:mm') : undefined;

  const initialData = {
    title: event.title ?? '',
    description: event.description ?? '',
    startDate,
    startTime,
    endTime,
    timezone: event.timezone,
    eventType: event.event_type,
    locationAddress: event.location_address ?? '',
    onlineMeetingLink: event.online_meeting_link ?? '',
    discussionLink: event.discussion_link ?? '',
    coverUrl: event.cover_url ?? '',
    status: event.status,
    externalPlatform: (event.external_platform as ExternalPlatform | null) ?? 'google_forms',
    externalRegistrationUrl: event.external_registration_url ?? '',
  };

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <ExternalEventForm
          communitySlug={dashboardData.community.slug}
          communityId={dashboardData.community.id}
          eventId={event.id}
          mode="edit"
          initialData={initialData}
        />
      </div>
    </div>
  );
}

