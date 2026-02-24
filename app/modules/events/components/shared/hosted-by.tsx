import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import type { Community } from "~/shared/models/entity.types";
import React from "react";

type Host = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: "host" | "co-host";
};

interface HostedByProps {
  hosts?: Host[];
  fallbackCommunity: Community;
  avatarSize?: string; // tailwind classes for size, e.g. "h-8 w-8"
}

export function HostedBy({ hosts, fallbackCommunity, avatarSize = "h-8 w-8" }: HostedByProps) {
  const navigate = useNavigate();

  const resolvedHosts: Host[] = hosts && hosts.length > 0
    ? hosts
    : [{ id: fallbackCommunity.id, name: fallbackCommunity.name, slug: fallbackCommunity.slug, logo_url: fallbackCommunity.logo_url, role: "host" }];

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Hosted By</h3>
      <div className="space-y-2">
        {resolvedHosts.map((host) => (
          <div key={host.id} className="flex items-center gap-3">
            <a
              href={`/c/${host.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/c/${host.slug}`);
              }}
              className="flex items-center gap-3"
            >
              <Avatar className={avatarSize}>
                <AvatarImage src={host.logo_url || ""} alt={host.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {host.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{host.name}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HostedBy;
