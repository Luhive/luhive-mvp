import { useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { JoinCommunityForm } from "~/modules/community/components/join-community-form";
import { resolveEventHostedByJoinCta } from "~/modules/community/utils/resolve-event-hosted-by-join-cta";
import type { Community } from "~/shared/models/entity.types";
import { Routes } from "~/shared/lib/routing/routes";
import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "~/shared/lib/utils";

type Host = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: "host" | "co-host";
  isMember?: boolean;
  settings?: Community["settings"];
  social_links?: Community["social_links"];
};

interface HostedByProps {
  hosts?: Host[];
  fallbackCommunity: Community;
  avatarSize?: string; // tailwind classes for size, e.g. "h-8 w-8"
  isLoggedIn?: boolean;
  userEmail?: string | null;
  hideLabelOnMobile?: boolean;
}

export function HostedBy({
  hosts,
  fallbackCommunity,
  avatarSize = "h-8 w-8",
  isLoggedIn,
  userEmail,
  hideLabelOnMobile = false,
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
            settings: fallbackCommunity.settings,
            social_links: fallbackCommunity.social_links,
          },
        ];

  const showJoin = isLoggedIn !== undefined;

  return (
    <div>
      <h3
        className={
          hideLabelOnMobile
            ? "hidden lg:block text-sm font-semibold text-muted-foreground mb-2"
            : "text-sm font-semibold text-muted-foreground mb-2"
        }
      >
        Hosted By
      </h3>
      <div className={cn("space-y-2", hideLabelOnMobile && "space-y-1 lg:space-y-2")}>
        {resolvedHosts.map((host) => {
          const joinCta = resolveEventHostedByJoinCta({
            settings: host.settings,
            socialLinks: host.social_links,
          });

          return (
            <div
              key={host.id}
              className={cn(
                "flex items-center gap-3",
                hideLabelOnMobile && "gap-2 lg:gap-3",
              )}
            >
              <a
                href={Routes.community.detail(host.slug)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(Routes.community.detail(host.slug));
                }}
                className={cn(
                  "flex items-center gap-3 min-w-0 flex-1 group",
                  hideLabelOnMobile && "gap-2 lg:gap-3",
                )}
              >
                <Avatar
                  className={cn(
                    avatarSize,
                    hideLabelOnMobile && "h-4 w-4 lg:h-8 lg:w-8",
                  )}
                >
                  <AvatarImage src={host.logo_url || ""} alt={host.name} />
                  <AvatarFallback
                    className={cn(
                      "bg-primary/10 text-primary text-xs font-semibold",
                      hideLabelOnMobile && "text-[8px] lg:text-xs",
                    )}
                  >
                    {host.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "text-sm truncate inline-flex items-center gap-0.5 min-w-0 group-hover:underline",
                    hideLabelOnMobile ? "font-bold lg:font-medium" : "font-medium",
                  )}
                >
                  {host.name}
                  <ChevronRight className="h-3.5 w-3.5 font-medium shrink-0 opacity-70" />
                </span>
              </a>
              {showJoin && (
                <div className="hidden lg:block shrink-0">
                  {joinCta.mode === "whatsapp" ? (
                    <Button
                      size="sm"
                      asChild
                      className="shrink-0 rounded-full py-0 h-8 bg-primary/15 text-primary/90 shadow-none hover:bg-primary/20"
                    >
                      <a
                        href={joinCta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {joinCta.label}
                      </a>
                    </Button>
                  ) : (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HostedBy;
