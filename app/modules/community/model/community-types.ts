import type { Database } from "~/shared/models/database.types";

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember =
  Database["public"]["Tables"]["community_members"]["Row"];
