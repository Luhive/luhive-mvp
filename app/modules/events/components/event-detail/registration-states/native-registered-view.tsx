import { Form } from "react-router";
import { CheckCircle2, Hourglass, AlertTriangle } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Activity } from "react";
import type { Event } from "~/shared/models/entity.types";

interface NativeRegisteredViewProps {
	event: Event;
	userRegistrationStatus: string | null;
	registrationCount: number;
	canRegister: boolean;
	isPastEvent: boolean;
	isUnregistering: boolean;
}

export function NativeRegisteredView({
	event,
	userRegistrationStatus,
	registrationCount,
	canRegister,
	isPastEvent,
	isUnregistering,
}: NativeRegisteredViewProps) {
	return (
		<>
			{userRegistrationStatus === "pending" ? (
				<div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900">
					<Hourglass className="h-5 w-5 flex-shrink-0" />
					<div>
						<p className="font-semibold text-sm">Registration Pending</p>
						<p className="text-xs opacity-90">Your request is waiting for approval.</p>
					</div>
				</div>
			) : userRegistrationStatus === "rejected" ? (
				<div className="flex items-center gap-2 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
					<AlertTriangle className="h-5 w-5 flex-shrink-0" />
					<div>
						<p className="font-semibold text-sm">Registration Rejected</p>
						<p className="text-xs opacity-90">Your registration request was declined.</p>
					</div>
				</div>
			) : (
				<div className="flex items-center gap-1 text-green-600 dark:text-green-500">
					<CheckCircle2 className="h-5 w-5" />
					<span className="font-semibold">You're registered for this event!</span>
				</div>
			)}

			<Activity
				mode={event.capacity && canRegister && !isPastEvent && userRegistrationStatus === "approved" ? "visible" : "hidden"}
			>
				<div className="flex items-center justify-between text-sm pt-3 border-t">
					<span className="text-muted-foreground">Capacity</span>
					<span className="font-semibold">
						{registrationCount}/{event.capacity || 0}
					</span>
				</div>
			</Activity>

			<Form method="post" className="pt-2">
				<input type="hidden" name="intent" value="unregister" />
				<Button type="submit" variant="outline" className="w-full" disabled={isUnregistering}>
					{isUnregistering ? "Cancelling..." : "Cancel Registration"}
				</Button>
			</Form>
		</>
	);
}
