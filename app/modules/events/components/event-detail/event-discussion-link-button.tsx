import { Button } from "~/shared/components/ui/button";
import {
	detectDiscussionPlatform,
	getPlatformIcon,
} from "~/modules/events/utils/discussion-platform";

interface EventDiscussionLinkButtonProps {
	discussionLink: string;
}

export function EventDiscussionLinkButton({
	discussionLink,
}: EventDiscussionLinkButtonProps) {
	const platform = detectDiscussionPlatform(discussionLink);
	const PlatformIcon = getPlatformIcon(platform);

	return (
		<Button asChild variant="outline" size="sm" className="w-full sm:w-auto h-8">
			<a href={discussionLink} target="_blank" rel="noopener noreferrer">
				<PlatformIcon className="h-4 w-4 mr-2" />
				Join Event Chat
			</a>
		</Button>
	);
}
