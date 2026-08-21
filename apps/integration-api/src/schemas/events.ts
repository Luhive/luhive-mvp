import { z } from 'zod';
import { decodeCursor } from '../lib/cursor';

// Boundary: the external DB row shape (internal name, no suffix).
export const EventRow = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  location_name: z.string().nullable(),
  online_meeting_link: z.string().nullable(),
  cover_url: z.string().nullable(),
  slug: z.string(),
  community: z.object({
    name: z.string(),
    slug: z.string(),
    is_show: z.boolean(),
  }),
});
export type EventRow = z.infer<typeof EventRow>;

// Request input: coercion, defaults, and refinements at the boundary.
export const PublicEventsRequest = z
  .object({
    when: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    q: z.string().trim().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z
      .string()
      .transform((raw, ctx) => {
        const decoded = decodeCursor(raw);
        if (!decoded) {
          ctx.addIssue({ code: 'custom', message: 'bad cursor' });
          return z.NEVER;
        }
        return decoded;
      })
      .optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'from must be <= to',
    path: ['from'],
  });
export type PublicEventsRequest = z.infer<typeof PublicEventsRequest>;

// Response DTO (contract + type).
export const PublicEventResponse = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  location: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  url: z.string(),
  community: z.object({ name: z.string(), slug: z.string() }),
});
export type PublicEventResponse = z.infer<typeof PublicEventResponse>;
