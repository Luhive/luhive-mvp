import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "~/shared/components/ui/avatar";

interface RegistrationIdentityRowProps {
	displayName: string;
	avatarUrl?: string | null;
	avatarInitials?: string;
	trailing?: React.ReactNode;
}

export function RegistrationIdentityRow({
	displayName,
	avatarUrl,
	avatarInitials,
	trailing,
}: RegistrationIdentityRowProps) {
	return (
		<div className="flex items-center justify-between gap-2 min-w-0">
			<div className="flex items-center gap-2 min-w-0">
				<Avatar className="h-7 w-7 shrink-0">
					<AvatarImage src={avatarUrl || undefined} alt={displayName} />
					<AvatarFallback className="bg-primary/10 text-primary text-[10px]">
						{avatarInitials}
					</AvatarFallback>
				</Avatar>
				<p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
			</div>
			{trailing}
		</div>
	);
}
