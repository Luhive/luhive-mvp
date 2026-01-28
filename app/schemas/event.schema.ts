import { z } from "zod";

/**
 * Schemas related to events.
 *
 * These schemas are designed to be compatible with the existing validation
 * logic in event forms while centralizing the rules in a single place.
 */

export const baseEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  eventType: z.enum(["in-person", "online", "hybrid"]),
  locationAddress: z.string().optional(),
  onlineMeetingLink: z.string().optional(),
  discussionLink: z.string().optional(),
});

export type BaseEventInput = z.infer<typeof baseEventSchema>;

