import type { EventPageUserState } from "~/modules/events/model/event-detail-view.types";
import type { Profile } from "~/shared/models/entity.types";

export interface OtpVerifySuccessResult {
	userId: string;
	email: string | null;
	fullName: string | null;
	avatarUrl: string | null;
	userProfile: Profile | null;
	registrationState?: EventPageUserState;
	isCommunityMember?: boolean;
	registeredEvent?: boolean;
	joined?: boolean;
	communitySlug?: string | null;
}
