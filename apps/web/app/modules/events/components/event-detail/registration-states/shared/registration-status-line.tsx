import { cn } from "~/shared/lib/utils";

type RegistrationStatusVariant = "green" | "amber" | "red" | "default";

const variantClasses: Record<RegistrationStatusVariant, string> = {
	green: "text-green-600 dark:text-green-500",
	amber: "text-amber-600 dark:text-amber-500",
	red: "text-red-600 dark:text-red-500",
	default: "text-foreground",
};

interface RegistrationStatusLineProps {
	children: React.ReactNode;
	variant?: RegistrationStatusVariant;
	className?: string;
}

export function RegistrationStatusLine({
	children,
	variant = "default",
	className,
}: RegistrationStatusLineProps) {
	return (
		<p className={cn("text-lg font-semibold", variantClasses[variant], className)}>
			{children}
		</p>
	);
}
