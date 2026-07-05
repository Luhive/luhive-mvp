interface RegistrationTwoColumnLayoutProps {
	leftColumn: React.ReactNode;
	rightColumn?: React.ReactNode | null;
	leftFooter?: React.ReactNode;
}

export function RegistrationTwoColumnLayout({
	leftColumn,
	rightColumn,
	leftFooter,
}: RegistrationTwoColumnLayoutProps) {
	const hasRightColumn = rightColumn != null;

	if (!hasRightColumn) {
		return (
			<div className="space-y-2">
				{leftColumn}
				{leftFooter}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div className="min-w-0 space-y-2 sm:flex-1">
				{leftColumn}
				{leftFooter ? <div className="hidden sm:block">{leftFooter}</div> : null}
			</div>

			<div className="flex flex-col gap-2 w-full sm:w-auto sm:shrink-0 sm:items-end">
				{rightColumn}
				{leftFooter ? <div className="sm:hidden">{leftFooter}</div> : null}
			</div>
		</div>
	);
}
