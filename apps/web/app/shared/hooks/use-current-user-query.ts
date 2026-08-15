import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "~/shared/models/entity.types";
import { currentUserKey } from "~/shared/lib/query/query-keys";

export { currentUserKey };

export function currentUserQueryOptions() {
	return {
		queryKey: currentUserKey,
		queryFn: async () => {
			const res = await fetch("/api/current-user");
			if (!res.ok) throw new Error("Failed to fetch current user");
			const data = (await res.json()) as { user: Profile | null };
			return data.user;
		},
		staleTime: 30_000,
	};
}

export function useCurrentUserQuery() {
	return useQuery(currentUserQueryOptions());
}

export function useSetCurrentUserCache() {
	const queryClient = useQueryClient();

	return useCallback(
		(user: Profile | null, revalidate = true) => {
			queryClient.setQueryData<Profile | null>(currentUserKey, user);
			if (revalidate) {
				void queryClient.invalidateQueries({ queryKey: currentUserKey });
			}
		},
		[queryClient],
	);
}
