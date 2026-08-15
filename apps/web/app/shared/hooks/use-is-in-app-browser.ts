import { useEffect, useState } from "react";
import { isInAppBrowser } from "~/shared/lib/is-in-app-browser";

/**
 * Client-only in-app browser detection. Defaults to `false` on SSR so the
 * first paint matches hydration; may flip to `true` after mount.
 */
export function useIsInAppBrowser(): boolean {
	const [inApp, setInApp] = useState(false);

	useEffect(() => {
		setInApp(isInAppBrowser(navigator.userAgent));
	}, []);

	return inApp;
}
