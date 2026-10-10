import { useEffect, useState } from "react";
import { buildExternalBrowserUrl } from "~/shared/lib/external-browser-url";

export function OpenInExternalBrowserLink({
	prompt,
	label,
	onOpen,
}: {
	prompt: string;
	label: string;
	onOpen?: () => void;
}) {
	const [externalUrl, setExternalUrl] = useState<string | null>(null);

	useEffect(() => {
		setExternalUrl(
			buildExternalBrowserUrl(window.location.href, navigator.userAgent),
		);
	}, []);

	if (!externalUrl) return null;

	return (
		<p className="text-center text-sm text-muted-foreground">
			{prompt}{" "}
			<a
				href={externalUrl}
				onClick={onOpen}
				className="font-medium underline underline-offset-2 transition-colors hover:text-foreground"
			>
				{label}
			</a>
		</p>
	);
}
