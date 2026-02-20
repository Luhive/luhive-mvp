import { Link, Form } from "react-router";
import { Activity } from "react";
import { Hourglass, CalendarClock } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Avatar, AvatarFallback } from "~/shared/components/ui/avatar";
import type { Community, Event } from "~/shared/models/entity.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";
import type { TimeRemaining } from "~/modules/events/model/event-detail-view.types";

interface NativeCanRegisterViewProps {
	event: Event;
	community: Community;
	userData: UserData;
	timeRemaining: TimeRemaining | null;
	registrationDeadlineFormatted: string;
	hasCustomQuestions: boolean;
	isRegistering: boolean;
	isSubmitting: boolean;
	onShowCustomQuestionsForm: () => void;
	onShowAnonymousDialog: () => void;
}

export function NativeCanRegisterView({
	event,
	community,
	userData,
	timeRemaining,
	registrationDeadlineFormatted,
	hasCustomQuestions,
	isRegistering,
	isSubmitting,
	onShowCustomQuestionsForm,
	onShowAnonymousDialog,
}: NativeCanRegisterViewProps) {
	const { user, userProfile } = userData;

	return (
		<>
			<Activity mode={!!timeRemaining ? "visible" : "hidden"}>
				<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
						<Hourglass className="h-4 w-4 text-primary" />
					</div>
					<div className="space-y-0.5">
						<p className="text-sm font-medium">
							Registration closes in{" "}
							<span className="text-primary font-bold">{timeRemaining?.formatted}</span>
						</p>
						<p className="text-xs text-muted-foreground">Secure your spot before it's too late!</p>
					</div>
				</div>
			</Activity>

			<Activity mode={!timeRemaining && event.registration_deadline ? "visible" : "hidden"}>
				<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
						<CalendarClock className="h-4 w-4 text-muted-foreground" />
					</div>
					<div className="space-y-0.5">
						<p className="text-sm font-medium">Registration closes {registrationDeadlineFormatted}</p>
						<p className="text-xs text-muted-foreground">Don't miss out!</p>
					</div>
				</div>
			</Activity>

			<p className="text-sm text-foreground mb-4">
				Welcome! To join the event, please register below.
			</p>

			<Activity mode={user ? "visible" : "hidden"}>
				<div className="flex items-center gap-2">
					<Avatar className="h-6 w-6">
						<AvatarFallback className="bg-primary/10 text-primary text-xs">
							{userProfile?.full_name
								? userProfile.full_name
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()
										.slice(0, 2)
								: user?.email?.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						{userProfile?.full_name ? (
							<>
								<span className="text-sm font-semibold text-foreground">{userProfile.full_name}</span>
								<span className="text-xs text-muted-foreground">{user?.email}</span>
							</>
						) : (
							<span className="text-sm text-muted-foreground">{user?.email}</span>
						)}
					</div>
				</div>
			</Activity>

			<Activity mode={user ? "visible" : "hidden"}>
				{hasCustomQuestions ? (
					<Button
						type="button"
						onClick={onShowCustomQuestionsForm}
						className="w-full"
						size="sm"
						disabled={isRegistering}
					>
						Register
					</Button>
				) : (
					<Form method="post">
						<input type="hidden" name="intent" value="register" />
						<Button type="submit" className="w-full" size="sm" disabled={isRegistering}>
							{isRegistering ? "Registering..." : "Register"}
						</Button>
					</Form>
				)}
			</Activity>

			<Activity mode={!user ? "visible" : "hidden"}>
				<div className="space-y-3">
					<Button
						onClick={onShowAnonymousDialog}
						className="w-full"
						size="lg"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Processing..." : "Register for Event"}
					</Button>
					<p className="text-xs text-center text-muted-foreground">
						Already have an account?{" "}
						<Link
							to={`/login?redirect=/c/${community.slug}/events/${event.id}`}
							className="underline hover:text-foreground font-medium"
						>
							Login
						</Link>
					</p>
				</div>
			</Activity>
		</>
	);
}
