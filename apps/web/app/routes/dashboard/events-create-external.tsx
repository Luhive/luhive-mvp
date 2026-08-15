import { ExternalEventForm } from '~/modules/events/components/event-form/external-event-form';
import { useDashboardContext } from '~/modules/dashboard/hooks/use-dashboard-context';

export function meta() {
  return [
    { title: "Create Link Event - Dashboard" },
    { name: "description", content: "Create a new link event that redirects to an external page" },
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
          communityName={community.name}
          mode="create"
        />
      </div>
    </div>
  );
}

