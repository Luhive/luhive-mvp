import { TopNavigation } from "~/shared/components/navigation";
import { CommunityPageSkeleton } from "~/modules/community/components/community-page-skeleton";
import type { CommunityWithStats } from "~/modules/events/model/event-detail-view.types";

type TopNavUser = {
	id: string;
	avatar_url?: string | null;
	full_name?: string | null;
} | null;

interface CommunityOverlaySkeletonProps {
	pendingCommunity: CommunityWithStats;
	user?: TopNavUser;
}

/**
 * Full-screen overlay skeleton shown when navigating from event to community.
 * Replaces repeated overlay blocks in event-detail route.
 */
export function CommunityOverlaySkeleton({
	pendingCommunity,
	user,
}: CommunityOverlaySkeletonProps) {
	return (
		<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
			<div className="min-h-screen container mx-auto px-4 sm:px-8 flex flex-col">
				<TopNavigation user={user ?? undefined} />
				<div className="lg:py-8 py-4 flex-1">
					<CommunityPageSkeleton
						community={{
							...pendingCommunity.community,
							memberCount: pendingCommunity.memberCount,
							eventCount: pendingCommunity.eventCount,
							description: pendingCommunity.description ?? pendingCommunity.community.description ?? "",
							verified: pendingCommunity.verified ?? false,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
