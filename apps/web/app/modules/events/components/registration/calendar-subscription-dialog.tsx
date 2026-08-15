import { useMemo, useState } from "react";
import { Calendar, CalendarPlus } from "lucide-react";
import { CalendarSubscription } from "~/modules/events/utils/calendar-subscription";
import { Button } from "~/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/shared/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "~/shared/components/ui/sheet";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { cn } from "~/shared/lib/utils/cn";

interface CalendarSubscriptionButtonProps {
	title: string;
	description?: string | null;
	startTime: string;
	endTime?: string | null;
	timezone: string;
	locationAddress?: string | null;
	onlineMeetingLink?: string | null;
	communityName?: string;
	className?: string;
}

function GoogleIcon({ className, userEmail = 'email' }: { className?: string, userEmail?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 48 48"
			className={className}
			aria-hidden
			focusable="false"
		>
			<path
				fill="#FFC107"
				d="M43.611 20.083H42V20H24v8h11.303C33.843 32.658 29.29 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.143-7.656 19.143-20 0-1.341-.147-2.652-.432-3.917z"
			/>
			<path
				fill="#FF3D00"
				d="M6.306 14.691l6.571 4.813C14.297 16.128 18.787 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 15.316 4 7.954 8.924 6.306 14.691z"
			/>
			<path
				fill="#4CAF50"
				d="M24 44c5.196 0 9.86-1.992 13.38-5.223l-6.173-5.234C29.093 34.484 26.682 35.5 24 35.5c-5.262 0-9.799-3.507-11.397-8.248l-6.52 5.017C8.704 39.043 15.83 44 24 44z"
			/>
			<path
				fill="#1976D2"
				d="M43.611 20.083H42V20H24v8h11.303c-1.018 2.977-3.279 5.308-6.093 6.443l.001-.001 6.173 5.234C34.84 40.782 43 36 43 24c0-1.341-.147-2.652-.432-3.917z"
			/>
		</svg>
	);
}

function MicrosoftIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 23 23"
			className={className}
			aria-hidden
			focusable="false"
		>
			<path fill="#f25022" d="M1 1h10v10H1z" />
			<path fill="#00a4ef" d="M12 1h10v10H12z" />
			<path fill="#7fba00" d="M1 12h10v10H1z" />
			<path fill="#ffb900" d="M12 12h10v10H12z" />
		</svg>
	);
}

function CalendarProviderOption({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full group items-center gap-0 rounded-md py-1 text-left transition-colors hover:bg-muted/40 active:scale-[0.99]"
		>
			<span className="flex h-9 w-9 shrink-0 items-center justify-center">
				{children}
			</span>
			<span className="text-sm font-medium underline decoration-dotted underline-offset-4">
				{label}
			</span>
		</button>
	);
}

function CalendarSubscriptionContent({
	subscription,
}: {
	subscription: CalendarSubscription;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<CalendarPlus className="h-5 w-5 text-muted-foreground" />
					<h2 className="text-lg font-semibold">Add to Calendar</h2>
				</div>
				<p className="text-sm text-muted-foreground">
					The invite was already sent your email, do not forget to check{" "}
					<span className="font-medium text-destructive">spam folder</span>
				</p>
			</div>

			<div className="space-y-1">
				<CalendarProviderOption
					label="Google Calendar"
					onClick={() => subscription.openGoogleCalendar()}
				>
					<GoogleIcon className="h-5 w-5" />
				</CalendarProviderOption>

				<CalendarProviderOption
					label="Outlook"
					onClick={() => subscription.openOutlook()}
				>
					<MicrosoftIcon className="h-5 w-5" />
				</CalendarProviderOption>

				<CalendarProviderOption
					label="ICal"
					onClick={() => subscription.downloadIcs()}
				>
					<Calendar className="h-5 w-5 text-muted-foreground" />
				</CalendarProviderOption>
			</div>
		</div>
	);
}

export function CalendarSubscriptionButton({
	title,
	description,
	startTime,
	endTime,
	timezone,
	locationAddress,
	onlineMeetingLink,
	communityName,
	className,
}: CalendarSubscriptionButtonProps) {
	const [open, setOpen] = useState(false);
	const isMobile = useIsMobile();

	const subscription = useMemo(() => {
		const eventUrl = typeof window !== "undefined" ? window.location.href : "";
		const location = locationAddress || onlineMeetingLink || undefined;

		return new CalendarSubscription({
			title,
			description,
			startTime,
			endTime,
			timezone,
			location,
			url: eventUrl,
			organizerName: communityName,
		});
	}, [
		title,
		description,
		startTime,
		endTime,
		timezone,
		locationAddress,
		onlineMeetingLink,
		communityName,
	]);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className={cn("shrink-0 h-8 w-full sm:w-auto", className)}
				onClick={() => setOpen(true)}
			>
				<CalendarPlus className="h-4 w-4" />
				Add my calendar
			</Button>

			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-6">
						<SheetHeader className="sr-only">
							<SheetTitle>Add to Calendar</SheetTitle>
						</SheetHeader>
						<CalendarSubscriptionContent subscription={subscription} />
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader className="sr-only">
							<DialogTitle>Add to Calendar</DialogTitle>
						</DialogHeader>
						<CalendarSubscriptionContent subscription={subscription} />
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
