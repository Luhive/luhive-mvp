import { ExternalEventForm } from '~/components/events/external-event-form';
import { useOutletContext } from 'react-router';
import type { DashboardLoaderData } from '~/routes/dashboard/layout';

export function meta() {
  return [
    { title: "Create External Event - Dashboard" },
    { name: "description", content: "Create a new event with external registration" },
  ];
}

export default function CreateExternalEventPage() {
  const { dashboardData } = useOutletContext<{ dashboardData: DashboardLoaderData }>();

  if (!dashboardData) {
    return null;
  }

  const { community } = dashboardData;

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

