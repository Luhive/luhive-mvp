import { EventForm } from '~/components/events/event-form';
import { useDashboardCommunity } from '~/hooks/use-dashboard-community';
import { DashboardEventFormSkeleton } from '~/components/dashboard/dashboard-event-form-skeleton';

export function meta() {
  return [
    { title: "Create Event - Dashboard" },
    { name: "description", content: "Create a new community event" },
  ];
}

export default function CreateEventPage() {
  const { data, loading } = useDashboardCommunity();

  if (loading || !data) {
    return <DashboardEventFormSkeleton />;
  }

  const { community } = data;

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

