import { Link } from "react-router";
import { Settings, Users, ExternalLink } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import type { Community, Event } from "~/shared/models/entity.types";

interface AdminManagementViewProps {
	event: Event;
	community: Community;
	isExternalEvent: boolean;
}

export function AdminManagementView({ event, community, isExternalEvent }: AdminManagementViewProps) {
	return (
    <>
      <p className="text-sm text-muted-foreground">
        You are an admin of this community. Manage this event from the
        dashboard.
      </p>
      <div className="space-y-2">
        <Button
          asChild
          className="w-full bg-primary hover:bg-primary/80"
          size="lg"
        >
          <Link to={`/dashboard/${community.slug}/events`}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Event
          </Link>
        </Button>
        {!isExternalEvent && (
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link
              to={`/dashboard/${community.slug}/attenders?eventId=${event.id}`}
            >
              <Users className="h-4 w-4 mr-2" />
              Check Attendance List
            </Link>
          </Button>
        )}
        {isExternalEvent && event.external_registration_url && (
          <Button asChild variant="outline" className="w-full" size="lg">
            <a
              href={event.external_registration_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Registration Form
            </a>
          </Button>
        )}
      </div>
    </>
  );
}
