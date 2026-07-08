import { Button } from "~/shared/components/ui/button";
import {
	detectDiscussionPlatform,
	getPlatformIcon,
} from "~/modules/events/utils/discussion-platform";
import { cn } from "~/shared/lib/utils/cn";

interface EventDiscussionLinkButtonProps {
	discussionLink: string;
	className?: string;
}

export function EventDiscussionLinkButton({
	discussionLink,
	className,
}: EventDiscussionLinkButtonProps) {
	const platform = detectDiscussionPlatform(discussionLink);
	const PlatformIcon = getPlatformIcon(platform);

	return (
		<Button
			asChild
			variant="outline"
			size="sm"
			className={cn("w-full sm:w-auto h-8", className)}
		>
			<a href={discussionLink} target="_blank" rel="noopener noreferrer">
				<PlatformIcon className="h-4 w-4 mr-2" />
				Join Event Chat
			</a>
		</Button>
	);
}
