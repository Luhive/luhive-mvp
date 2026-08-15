import { ExternalLink, Users } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import type { Community, Event } from "~/shared/models/entity.types";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { getExternalPlatformName } from "~/modules/events/utils/external-platform";

interface ExternalLinkViewProps {
	event: Event;
	community: Community;
	externalPlatform: ExternalPlatform | null;
	externalPlatformName: string;
}

export function ExternalLinkView({
	event,
	community,
	externalPlatform,
	externalPlatformName,
}: ExternalLinkViewProps) {
	const platformName = externalPlatform
		? getExternalPlatformName(externalPlatform)
		: externalPlatformName;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Users className="h-4 w-4 shrink-0" />
				<span>
					Hosted by <span className="font-medium text-foreground">{community.name}</span>
				</span>
			</div>

			<p className="text-sm text-foreground">
				This event is hosted on an external page. Visit the event page for full details and
				registration.
			</p>

			<Button asChild className="w-full" size="lg">
				<a
					href={event.external_registration_url || "#"}
					target="_blank"
					rel="noopener noreferrer"
				>
					Go to event
					<ExternalLink className="h-4 w-4 ml-2" />
				</a>
			</Button>

			<p className="text-xs text-center text-muted-foreground">
				You will be redirected to {platformName}
			</p>
		</div>
	);
}
