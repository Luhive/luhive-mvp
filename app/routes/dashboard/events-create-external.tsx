import { ExternalEventForm } from '~/components/events/external-event-form';
import { useDashboardCommunity } from '~/hooks/use-dashboard-community';
import { DashboardEventFormSkeleton } from '~/components/dashboard/dashboard-event-form-skeleton';

export function meta() {
  return [
    { title: "Create External Event - Dashboard" },
    { name: "description", content: "Create a new event with external registration" },
  ];
}

export default function CreateExternalEventPage() {
  const { data, loading } = useDashboardCommunity();

  if (loading || !data) {
    return <DashboardEventFormSkeleton />;
  }

  const { community } = data;

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

