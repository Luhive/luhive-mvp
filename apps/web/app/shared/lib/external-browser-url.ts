/**
 * Builds a URL that asks the OS to reopen `pageUrl` outside the current
 * in-app browser. Returns `null` when the platform has no reliable scheme.
 *
 * - Android: Chrome intent, falling back to the plain URL if Chrome is missing.
 * - iOS 17+: `x-safari-https://` opens Safari directly.
 */
export function buildExternalBrowserUrl(
	pageUrl: string,
	userAgent: string,
): string | null {
	let url: URL;
	try {
		url = new URL(pageUrl);
	} catch {
		return null;
	}

	if (/Android/i.test(userAgent)) {
		const fallbackUrl = encodeURIComponent(url.toString());
		return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
	}

	if (/iPhone|iPad|iPod/i.test(userAgent)) {
		return `x-safari-${url.toString()}`;
	}

	return null;
}
