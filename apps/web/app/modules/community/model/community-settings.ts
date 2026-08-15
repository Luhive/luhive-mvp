export type EventHostedByJoinMode = "whatsapp" | "luhive";

export type CommunitySettings = {
  event_hosted_by_join?: EventHostedByJoinMode;
};

export type CommunitySocialLinks = {
  website?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  discord?: string | null;
};

export type EventHostedByJoinCta =
  | { mode: "whatsapp"; url: string; label: string }
  | { mode: "luhive" };
