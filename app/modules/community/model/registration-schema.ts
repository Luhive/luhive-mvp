import { z } from "zod";

// Schemas for joining communities (guest vs member flows)

export const guestJoinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  communityId: z.string().min(1, "Community ID is required"),
});

export const memberJoinSchema = z.object({
  communityId: z.string().min(1, "Community ID is required"),
});

export type GuestJoinFormValues = z.infer<typeof guestJoinSchema>;
export type MemberJoinFormValues = z.infer<typeof memberJoinSchema>;
