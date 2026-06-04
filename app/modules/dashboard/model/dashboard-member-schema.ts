import { z } from "zod";

export const communityMemberRoleSchema = z.enum(["member", "admin", "owner"]);

export const memberSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  joined_at: z.string(),
  role: communityMemberRoleSchema.optional(),
});

export type MemberRow = z.infer<typeof memberSchema>;
