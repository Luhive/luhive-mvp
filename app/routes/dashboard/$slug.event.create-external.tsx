import { useRouteLoaderData } from 'react-router';
import type { DashboardLoaderData } from './layout';
import { ExternalEventForm } from '~/components/events/external-event-form';

export function meta() {
  return [
    { title: "Create External Event - Dashboard" },
    { name: "description", content: "Create a new event with external registration" },
  ];
}

export default function CreateExternalEventPage() {
  const parentData = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout');

  if (!parentData) {
    return <div>Loading...</div>;
  }

  const { community } = parentData;

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <ExternalEventForm
          communitySlug={community.slug}
          communityId={community.id}
          mode="create"
        />
      </div>
    </div>
  );
}

