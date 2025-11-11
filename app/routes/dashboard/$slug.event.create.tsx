import { useRouteLoaderData } from 'react-router';
import type { DashboardLoaderData } from './layout';
import { EventForm } from '~/components/events/event-form';

export function meta() {
  return [
    { title: "Create Event - Dashboard" },
    { name: "description", content: "Create a new community event" },
  ];
}

export default function CreateEventPage() {
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout');

  if (!parentData) {
    return <div>Loading...</div>;
  }

  const { community } = parentData;

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <EventForm
          communitySlug={community.slug}
          communityId={community.id}
          mode="create"
        />
      </div>
    </div>
  );
}

