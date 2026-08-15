import { Badge } from "~/shared/components/ui/badge";
import { cn } from "~/shared/lib/utils";

interface EventStartCountdownBadgeProps {
	formatted: string | null | undefined;
	className?: string;
}

export function EventStartCountdownBadge({
	formatted,
	className,
}: EventStartCountdownBadgeProps) {
	if (!formatted) return null;

	return (
		<Badge
			variant="secondary"
			className={cn(
				"shrink-0 border-transparent bg-muted text-muted-foreground font-normal",
				className,
			)}
		>
			Starting in{" "}
			<span className="text-primary font-medium">{formatted}</span>
		</Badge>
	);
}
