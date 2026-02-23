import { Badge } from "~/shared/components/ui/badge";
import { Users } from "lucide-react";

interface CollaborationBadgeProps {
  role: "host" | "co-host";
  className?: string;
}

export function CollaborationBadge({ role, className }: CollaborationBadgeProps) {
  return (
    <Badge
      variant={role === "host" ? "default" : "secondary"}
      className={className}
    >
      <Users className="mr-1 h-3 w-3" />
      {role === "host" ? "Host" : "Co-host"}
    </Badge>
  );
}
