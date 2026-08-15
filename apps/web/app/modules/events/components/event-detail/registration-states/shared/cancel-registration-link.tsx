import { Form } from "react-router";

interface CancelRegistrationLinkProps {
	isUnregistering: boolean;
}

export function CancelRegistrationLink({ isUnregistering }: CancelRegistrationLinkProps) {
	return (
		<Form method="post">
			<input type="hidden" name="intent" value="unregister" />
			<p className="text-xs text-muted-foreground">
				Can&apos;t attend? Notify the host by{" "}
				<button
					type="submit"
					disabled={isUnregistering}
					className="text-destructive underline font-medium disabled:opacity-50"
				>
					{isUnregistering ? "canceling..." : "canceling"}
				</button>{" "}
				your registration.
			</p>
		</Form>
	);
}
