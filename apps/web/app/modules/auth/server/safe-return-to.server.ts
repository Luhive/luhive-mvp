export function getSafeReturnTo(returnTo: string | null): string | null {
	if (!returnTo) return null;

	const trimmed = returnTo.trim();
	if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;

	return trimmed;
}
