import type { ActionFunctionArgs } from "react-router";
import { EventForm } from '~/modules/events/components/event-form/event-form';
import { useDashboardContext } from '~/modules/dashboard/hooks/use-dashboard-context';
import { eventCreateAction } from '~/modules/events/server/event-create-action.server';

export function meta() {
  return [
    { title: "Create Event - Dashboard" },
    { name: "description", content: "Create a new community event" },
  ];
}

export async function action(args: ActionFunctionArgs) {
  return eventCreateAction(args);
}

export default function CreateEventPage() {
  const { community } = useDashboardContext();

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
