export function GoogleInAppBrowserHint({ className }: { className?: string }) {
	return (
		<p className={className ?? "text-sm text-muted-foreground"}>
			Google sign-in isn’t available{" "}
			<span className="font-medium text-orange-500">in-app</span> browser. Open
			this page in Safari or Chrome
		</p>
	);
}
