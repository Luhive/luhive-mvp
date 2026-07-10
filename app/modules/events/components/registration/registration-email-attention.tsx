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

interface RegistrationEmailAttentionProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status?: "approved" | "pending" | string | null;
}

function RegistrationEmailAttentionContent({
	status,
	onDismiss,
}: {
	status?: "approved" | "pending" | string | null;
	onDismiss: () => void;
}) {
	const isPending = status === "pending";

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<h2 className="text-lg font-semibold">Check your email</h2>
				<p className="text-sm text-muted-foreground">
					We sent a{isPending ? "n approval" : " registration"} email. If it has
					not arrived, check your{" "}
					<span className="font-bold text-orange-500">spam</span> folder and mark
					us as safe.
				</p>
			</div>
			<Button type="button" className="w-full" onClick={onDismiss}>
				Got it
			</Button>
		</div>
	);
}

export function RegistrationEmailAttention({
	open,
	onOpenChange,
	status,
}: RegistrationEmailAttentionProps) {
	const isMobile = useIsMobile();

	const handleDismiss = () => onOpenChange(false);

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-6">
					<SheetHeader className="sr-only">
						<SheetTitle>Check your email</SheetTitle>
					</SheetHeader>
					<RegistrationEmailAttentionContent
						status={status}
						onDismiss={handleDismiss}
					/>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="sr-only">
					<DialogTitle>Check your email</DialogTitle>
				</DialogHeader>
				<RegistrationEmailAttentionContent
					status={status}
					onDismiss={handleDismiss}
				/>
			</DialogContent>
		</Dialog>
	);
}
