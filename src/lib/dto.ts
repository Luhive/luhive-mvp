import type { EventRow, PublicEventResponse } from '../schemas/events';

export function toPublicEventResponse(row: EventRow): PublicEventResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    starts_at: row.start_time,
    ends_at: row.end_time,
    location: row.location_name ?? (row.online_meeting_link ? 'Online' : null),
    cover_image_url: row.cover_url,
    url: `https://luhive.com/c/${row.community.slug}/${row.slug}`,
    community: { name: row.community.name, slug: row.community.slug },
  };
}
