import { Linkedin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import type { Profile } from "~/shared/models/entity.types";
import type { ProfileSocialLinks } from "~/modules/profile/models/profile.types";

interface ProfileHeaderProps {
  user: Profile;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const socialLinks = (user.metadata as ProfileSocialLinks | null) ?? {};
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar className="h-24 w-24 border-2">
        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
        <AvatarFallback className="bg-gradient-avatar text-2xl font-semibold">
          {getInitials(user.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{user.full_name ?? "User"}</h1>
        {user.bio && (
          <p className="text-muted-foreground text-sm">{user.bio}</p>
        )}
        {joinedDate && (
          <p className="text-muted-foreground text-xs">Joined on {joinedDate}</p>
        )}
      </div>

      {(socialLinks.linkedin || socialLinks.twitter) && (
        <div className="flex items-center gap-3">
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="size-5" />
            </a>
          )}
          {socialLinks.twitter && (
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X (Twitter)"
            >
              <XIcon className="size-5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
