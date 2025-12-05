import { useLoaderData, useRouteLoaderData, useSearchParams } from 'react-router';
import { lazy, Suspense } from 'react';
import type { Route } from './+types/$slug.attenders';
import type { DashboardLoaderData } from './layout';
import { createClient } from '~/lib/supabase.server';
import { AttendersTableSkeleton } from '~/components/events/attenders-table-skeleton';
import type { Database } from '~/models/database.types';
import { Skeleton } from '~/components/ui/skeleton';

// Lazy load the heavy table component
const AttendersTable = lazy(() => 
  import('~/components/events/attenders-table').then(m => ({ default: m.AttendersTable }))
);

type LoaderData = {
  event: Database['public']['Tables']['events']['Row'] | null;
  eventId: string | null;
};


export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const slug = params.slug;
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!slug || !eventId) {
    return { event: null, eventId: null };
  }

  // Get community ID from slug
  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!community) {
    return { event: null, eventId: null };
  }

  // Verify event belongs to community (fast validation only)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('community_id', community.id)
    .single();

  if (eventError || !event) {
    return { event: null, eventId: null };
  }

  // Return only event data - attenders will be fetched client-side
  return { event, eventId };
}

export function meta() {
  return [
    { title: "Event Attenders - Dashboard" },
    { name: "description", content: "View and manage event attenders" },
  ];
}

export default function AttendersPage() {
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout');
  const { event, eventId } = useLoaderData<typeof loader>();

  if (!parentData) {
    return (
      <div className="py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <AttendersTableSkeleton />
        </div>
      </div>
    );
  }

  if (!eventId || !event) {
    return (
      <div className="py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground">
                Please select an event to view attenders.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Renders immediately */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {event.registration_type === 'external' ? 'Event Subscribers' : 'Event Attenders'}
          </h1>
          <div className="space-y-1">
            <h2 className="text-lg font-medium">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              {event.registration_type === 'external'
                ? 'Manage and view all subscribers for this event'
                : 'Manage and view all registered attenders for this event'}
            </p>
          </div>
        </div>

        {/* Attenders Table - Lazy loaded and fetches data client-side */}
        <Suspense fallback={<AttendersTableSkeleton />}>
          <AttendersTable eventId={eventId} isExternalEvent={event.registration_type === 'external'} />
        </Suspense>
      </div>
    </div>
  );
}

