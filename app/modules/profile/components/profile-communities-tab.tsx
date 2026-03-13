import { Link } from "react-router";
import { BadgeCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Badge } from "~/shared/components/ui/badge";
import type { ProfileCommunityItem } from "~/modules/profile/models/profile.types";

interface ProfileCommunitiesTabProps {
  communities: ProfileCommunityItem[];
}

function CommunityRow({ item }: { item: ProfileCommunityItem }) {
  const { role, community, memberCount } = item;

  const roleLabel =
    role === "owner"
      ? "Owner"
      : role === "admin"
        ? "Admin"
        : "Member";

  const roleBadgeVariant =
    role === "owner" || role === "admin" ? "outline" : "secondary";

  return (
    <Link
      to={`/c/${community.slug}`}
      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={community.logo_url || undefined} alt={community.name} />
          <AvatarFallback className="text-sm font-semibold">
            {community.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-base truncate">{community.name}</span>
            {community.verified && (
              <BadgeCheck className="size-5 text-green-500 shrink-0" />
            )}
          </div>
          {memberCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Users className="size-3.5" />
              <span>{memberCount} members</span>
            </div>
          )}
        </div>
      </div>
      <Badge
        variant={roleBadgeVariant}
        className={`shrink-0 capitalize${role === "owner" || role === "admin" ? " bg-primary/10 text-primary border-primary/20" : ""}`}
      >
        {roleLabel}
      </Badge>
    </Link>
  );
}

export function ProfileCommunitiesTab({ communities }: ProfileCommunitiesTabProps) {
  const elevated = communities.filter(
    (c) => c.role === "owner" || c.role === "admin"
  );
  const memberships = communities.filter(
    (c) => c.role !== "owner" && c.role !== "admin"
  );

  if (communities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        No communities yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {elevated.length > 0 && (
        <div className="space-y-2">
          {elevated.map((item) => (
            <CommunityRow key={item.community.id} item={item} />
          ))}
        </div>
      )}

      {memberships.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            Memberships
          </h3>
          {memberships.map((item) => (
            <CommunityRow key={item.community.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
