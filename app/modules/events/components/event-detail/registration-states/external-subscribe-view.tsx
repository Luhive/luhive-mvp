import { Form } from "react-router";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import { getExternalPlatformIcon } from "~/modules/events/utils/external-platform";
import type { Event } from "~/shared/models/entity.types";
import type { ExternalPlatform } from "~/modules/events/model/event.types";

interface ExternalSubscribeViewProps {
	event: Event;
	externalPlatform: ExternalPlatform | null;
	externalPlatformName: string;
	registrationCount: number;
	isUserRegistered: boolean;
	user: { id: string; email?: string | null } | null;
	isSubmitting: boolean;
	onShowSubscribeDialog: () => void;
}

const BELL_ANIMATION = { animation: "bell-ring 1s ease-in-out infinite" as const };

export function ExternalSubscribeView({
	event,
	externalPlatform,
	externalPlatformName,
	registrationCount,
	isUserRegistered,
	user,
	isSubmitting,
	onShowSubscribeDialog,
}: ExternalSubscribeViewProps) {
	const ExternalPlatformIcon = externalPlatform
		? getExternalPlatformIcon(externalPlatform)
		: ExternalLink;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
				<ExternalPlatformIcon className="h-6 w-6 flex-shrink-0 text-primary" />
				<div>
					<p className="font-medium text-sm text-primary">
						Registration on {externalPlatformName}
					</p>
					<p className="text-xs text-primary/70">This event uses external registration</p>
				</div>
			</div>

			{registrationCount > 0 && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Bell className="h-4 w-4" />
					<span>
						{registrationCount} {registrationCount === 1 ? "person" : "people"} subscribed
					</span>
				</div>
			)}

			<div className="space-y-3">
				{isUserRegistered ? (
					<div className="flex items-center gap-2 text-green-600 dark:text-green-500">
						<CheckCircle2 className="h-5 w-5" />
						<span className="font-semibold">You're subscribed for updates!</span>
					</div>
				) : (
					<>
						{user ? (
							<Form method="post">
								<input type="hidden" name="intent" value="subscribe" />
								<div className="relative w-full">
									<span className="absolute inset-0 rounded-md border-2 border-primary animate-pulse" />
									<Button
										type="submit"
										variant="outline"
										className="relative w-full border-primary"
										size="lg"
										disabled={isSubmitting}
									>
										<Bell className="h-4 w-4 mr-2 origin-top" style={BELL_ANIMATION} />
										{isSubmitting ? "Subscribing..." : "Subscribe for Updates"}
									</Button>
								</div>
							</Form>
						) : (
							<div className="relative w-full">
								<span className="absolute inset-0 rounded-md border-2 border-primary animate-pulse" />
								<Button
									type="button"
									variant="outline"
									className="relative w-full border-primary"
									size="lg"
									onClick={onShowSubscribeDialog}
								>
									<Bell className="h-4 w-4 mr-2 origin-top" style={BELL_ANIMATION} />
									Subscribe for Updates
								</Button>
							</div>
						)}
					</>
				)}
			</div>

			<Separator />

			<div className="space-y-2">
				<p className="text-sm font-medium text-foreground">Complete your registration</p>
				<Button asChild className="w-full" size="lg">
					<a href={event.external_registration_url || "#"} target="_blank" rel="noopener noreferrer">
						Register on {externalPlatformName}
						<ExternalLink className="h-4 w-4 ml-2" />
					</a>
				</Button>
				<p className="text-xs text-center text-muted-foreground">
					You will be redirected to an external website to complete registration
				</p>
			</div>
		</div>
	);
}
