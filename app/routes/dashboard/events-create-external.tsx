import { ExternalEventForm } from '~/modules/events/components/external-event-form';
import { useDashboardContext } from '~/modules/dashboard/hooks/use-dashboard-context';

export function meta() {
  return [
    { title: "Create External Event - Dashboard" },
    { name: "description", content: "Create a new event with external registration" },
  ];
}

export default function CreateExternalEventPage() {
  const { community } = useDashboardContext();

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

