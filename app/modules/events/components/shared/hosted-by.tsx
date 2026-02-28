import { useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { JoinCommunityForm } from "~/modules/community/components/join-community-form";
import type { Community } from "~/shared/models/entity.types";
import React from "react";
import { UserCheck, UserRoundPlus } from "lucide-react";

type Host = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: "host" | "co-host";
  isMember?: boolean;
};

interface HostedByProps {
  hosts?: Host[];
  fallbackCommunity: Community;
  avatarSize?: string; // tailwind classes for size, e.g. "h-8 w-8"
  isLoggedIn?: boolean;
  userEmail?: string | null;
}

export function HostedBy({
  hosts,
  fallbackCommunity,
  avatarSize = "h-8 w-8",
  isLoggedIn,
  userEmail,
}: HostedByProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const resolvedHosts: Host[] =
    hosts && hosts.length > 0
      ? hosts
      : [
          {
            id: fallbackCommunity.id,
            name: fallbackCommunity.name,
            slug: fallbackCommunity.slug,
            logo_url: fallbackCommunity.logo_url,
            role: "host" as const,
          },
        ];

  const showJoin = isLoggedIn !== undefined;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
        Hosted By
      </h3>
      <div className="space-y-2">
        {resolvedHosts.map((host) => (
          <div key={host.id} className="flex items-center gap-3">
            <a
              href={`/c/${host.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/c/${host.slug}`);
              }}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <Avatar className={avatarSize}>
                <AvatarImage src={host.logo_url || ""} alt={host.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {host.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground truncate">
                {host.name}
              </span>
            </a>
            {showJoin && (
              <JoinCommunityForm
                communityId={host.id}
                communityName={host.name}
                userEmail={userEmail ?? undefined}
                isLoggedIn={isLoggedIn}
                isMember={host.isMember ?? false}
                returnTo={pathname}
                trigger={
                  host.isMember ? (
                    <Button
                      size="sm"
                      className="shrink-0 rounded-full py-0 h-8 bg-transparent border border-primary/50 text-primary/90 shadow-none hover:bg-primary/10"
                    >
                      Joined
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="shrink-0 rounded-full py-0 h-8  bg-primary/15 text-primary/90 shadow-none hover:bg-primary/20"
                    >
                      Join
                    </Button>
                  )
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HostedBy;
