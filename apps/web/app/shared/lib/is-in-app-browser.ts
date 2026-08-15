const IN_APP_BROWSER_MARKERS = [
	"Instagram",
	"FBAN",
	"FBAV",
	"FB_IAB",
	"FBAN/",
	"LinkedInApp",
	"TikTok",
	"BytedanceWebview",
	"Twitter",
	"TwitterAndroid",
	"Line/",
	"MicroMessenger",
	"Snapchat",
	"WhatsApp",
	"; wv)",
	"WebView",
	"GSA/",
] as const;

/**
 * Detects common in-app browsers / WebViews where Google OAuth is blocked
 * (`403: disallowed_useragent`).
 */
export function isInAppBrowser(userAgent: string): boolean {
	if (!userAgent) return false;

	return IN_APP_BROWSER_MARKERS.some((marker) => userAgent.includes(marker));
}
