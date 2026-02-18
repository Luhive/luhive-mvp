import { z } from "zod";

export const communityProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Community name is required")
    .max(255, "Community name must be less than 255 characters"),
  tagline: z
    .string()
    .max(5000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .max(20000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  website: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export type CommunityProfileInput = z.infer<typeof communityProfileSchema>;
