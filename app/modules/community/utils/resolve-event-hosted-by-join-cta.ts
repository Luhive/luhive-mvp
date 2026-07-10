import type {
  CommunitySettings,
  CommunitySocialLinks,
  EventHostedByJoinCta,
} from "~/modules/community/model/community-settings";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseCommunitySettings(value: unknown): CommunitySettings {
  const record = asRecord(value);
  if (!record) return {};

  const mode = record.event_hosted_by_join;
  if (mode === "whatsapp" || mode === "luhive") {
    return { event_hosted_by_join: mode };
  }
  return {};
}

export function parseCommunitySocialLinks(
  value: unknown,
): CommunitySocialLinks {
  const record = asRecord(value);
  if (!record) return {};

  const pick = (key: keyof CommunitySocialLinks): string | null => {
    const raw = record[key];
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  };

  return {
    website: pick("website"),
    instagram: pick("instagram"),
    linkedin: pick("linkedin"),
    whatsapp: pick("whatsapp"),
    discord: pick("discord"),
  };
}

/**
 * Resolves the Hosted By join CTA on event pages.
 * WhatsApp only when settings opt in and a WhatsApp URL exists; otherwise Luhive join/leave.
 */
export function resolveEventHostedByJoinCta(input: {
  settings: unknown;
  socialLinks: unknown;
}): EventHostedByJoinCta {
  const settings = parseCommunitySettings(input.settings);
  const socialLinks = parseCommunitySocialLinks(input.socialLinks);

  if (
    settings.event_hosted_by_join === "whatsapp" &&
    socialLinks.whatsapp
  ) {
    return {
      mode: "whatsapp",
      url: socialLinks.whatsapp,
      label: "Join WhatsApp",
    };
  }

  return { mode: "luhive" };
}
