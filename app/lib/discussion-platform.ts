import { MessageCircle, MessageSquare, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DiscussionPlatform = "whatsapp" | "discord" | "telegram" | "generic";

/**
 * Detects the discussion platform from a URL
 */
export function detectDiscussionPlatform(url: string): DiscussionPlatform {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // WhatsApp detection
    if (hostname.includes("chat.whatsapp.com")) {
      return "whatsapp";
    }

    // Discord detection
    if (hostname.includes("discord.gg") || hostname.includes("discord.com")) {
      return "discord";
    }

    // Telegram detection
    if (hostname.includes("t.me")) {
      return "telegram";
    }

    return "generic";
  } catch {
    return "generic";
  }
}

/**
 * Returns human-readable platform name
 */
export function getPlatformName(platform: DiscussionPlatform): string {
  switch (platform) {
    case "whatsapp":
      return "WhatsApp";
    case "discord":
      return "Discord";
    case "telegram":
      return "Telegram";
    case "generic":
      return "Discussion";
    default:
      return "Discussion";
  }
}

/**
 * Returns appropriate icon component for the platform
 */
export function getPlatformIcon(platform: DiscussionPlatform): LucideIcon {
  switch (platform) {
    case "whatsapp":
      return MessageCircle; // WhatsApp green can be styled with classes
    case "discord":
      return MessageSquare; // Discord purple can be styled with classes
    case "telegram":
      return MessageCircle; // Telegram blue can be styled with classes
    case "generic":
      return Users;
    default:
      return MessageCircle;
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

