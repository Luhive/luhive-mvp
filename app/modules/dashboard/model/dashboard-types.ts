import type { Community, Profile } from "~/shared/models/entity.types";

export type { Community, Profile };

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
