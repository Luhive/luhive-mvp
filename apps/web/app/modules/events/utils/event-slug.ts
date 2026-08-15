import { slugifyAscii } from "~/shared/lib/utils/slug";

/** Reserved under /c/:communitySlug/:segment — must not be used as event slugs. */
export const RESERVED_EVENT_SLUGS = new Set(["events", "announcements"]);

const MAX_SLUG_LENGTH = 60;

/**
 * Turn an event title into a URL-safe slug segment.
 */
export function slugifyEventTitle(title: string): string {
  const slug = slugifyAscii(title, MAX_SLUG_LENGTH);

  if (!slug) return "";
  if (RESERVED_EVENT_SLUGS.has(slug)) return `${slug}-event`;
  return slug;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Public URL segment for an event — prefers slug, falls back to id. */
export function publicEventSlug(event: {
  slug: string | null;
  id: string;
}): string {
  return event.slug ?? event.id;
}
