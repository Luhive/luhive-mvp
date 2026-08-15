export function getRegistrationDisplayName(
	userProfile: { full_name: string | null } | null,
	user: { email?: string | null } | null,
): string {
	return userProfile?.full_name?.trim() || user?.email?.split("@")[0] || "You";
}

export function getRegistrationAvatarInitials(
	userProfile: { full_name: string | null } | null,
	user: { email?: string | null } | null,
): string | undefined {
	if (userProfile?.full_name) {
		return userProfile.full_name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
	return user?.email?.charAt(0).toUpperCase();
}
