import type { Database } from "~/shared/models/database.types";

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type DashboardCommunityData = {
  community: Community;
  user: Profile;
  userEmail: string;
  role: "owner" | "admin";
};

export type DashboardLoaderData = {
  slug: string;
};

export type Member = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
  role: string;
};

export type DashboardStatsData = {
  totalVisits: number;
  uniqueVisitors: number;
  joinedUsers: number;
};