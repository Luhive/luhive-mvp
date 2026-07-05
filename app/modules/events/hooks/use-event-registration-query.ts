import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventPageUserState } from "~/modules/events/model/event-detail-view.types";
import {
	eventRegistrationKey,
	eventRegistrationRootKey,
} from "~/shared/lib/query/query-keys";

export { eventRegistrationRootKey as eventRegistrationQueryKey };

export function eventRegistrationQueryOptions(
	eventId: string,
	communityId: string,
) {
	return {
		queryKey: eventRegistrationKey(eventId),
		queryFn: async () => {
			const params = new URLSearchParams({
				eventId,
				communityId,
			});
			const res = await fetch(`/api/events/registration-state?${params}`);
			if (!res.ok) throw new Error("Failed to fetch registration state");
			return (await res.json()) as EventPageUserState;
		},
		staleTime: 30_000,
	};
}

export function toLoggedOutEventPageState(
	current: EventPageUserState,
): EventPageUserState {
	return {
		...current,
		isUserRegistered: false,
		userRegistrationStatus: null,
		userCheckinToken: null,
		user: null,
		userProfile: null,
		isCommunityMember: false,
		canRegister: current.isUserRegistered ? true : current.canRegister,
	};
}

export function clearEventRegistrationSessionState(
	queryClient: ReturnType<typeof useQueryClient>,
	{ revalidate = true }: { revalidate?: boolean } = {},
) {
	queryClient.setQueriesData<EventPageUserState>(
		{ queryKey: eventRegistrationRootKey },
		(current) => (current ? toLoggedOutEventPageState(current) : current),
	);
	if (revalidate) {
		void queryClient.invalidateQueries({ queryKey: eventRegistrationRootKey });
	}
}

export function useEventRegistrationQuery(eventId: string, communityId: string) {
	return useQuery(eventRegistrationQueryOptions(eventId, communityId));
}

/**
 * Merge known event-page user fields into the cache for an instant UI update,
 * then refetch in the background to reconcile anything not provided.
 */
export function useRegistrationCacheUpdate(eventId: string) {
	const queryClient = useQueryClient();

	return useCallback(
		(state: Partial<EventPageUserState>) => {
			queryClient.setQueryData<EventPageUserState>(
				eventRegistrationKey(eventId),
				(current) => (current ? { ...current, ...state } : current),
			);

			void queryClient.invalidateQueries({
				queryKey: eventRegistrationKey(eventId),
			});
		},
		[eventId, queryClient],
	);
}
