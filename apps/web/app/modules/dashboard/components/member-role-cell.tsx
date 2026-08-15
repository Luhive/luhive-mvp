import { Badge } from "~/shared/components/ui/badge";
import type { CommunityMemberRole } from "~/modules/dashboard/model/dashboard-types";

export function MemberRoleCell({ role }: { role: CommunityMemberRole }) {
  if (role === "admin") {
    return <Badge variant="secondary">Admin</Badge>;
  }

  return (
    <div className="capitalize text-muted-foreground">
      {role === "owner" ? "Owner" : "Member"}
    </div>
  );
}
