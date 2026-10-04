import { toast } from "sonner";
import type { Event } from "~/shared/models/entity.types";
import { Routes } from "~/shared/lib/routing/routes";
import { publicEventSlug } from "~/modules/events/utils/event-slug";

export function buildEventUrl(communitySlug: string, event: Event): string {
  return `${window.location.origin}${Routes.community.event(communitySlug, publicEventSlug(event))}`;
}

export function copyEventLink(communitySlug: string, event: Event): string {
  const url = buildEventUrl(communitySlug, event);
  navigator.clipboard.writeText(url);
  toast.success("Event link copied to clipboard!");
  return url;
}