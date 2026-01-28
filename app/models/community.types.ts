import type { Database } from "./database.types";

export type Community =
  Database["public"]["Tables"]["communities"]["Row"];

export type CommunityMember =
  Database["public"]["Tables"]["community_members"]["Row"];