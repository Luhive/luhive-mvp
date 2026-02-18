import type { Database } from "~/shared/models/database.types";

export type Community = Database["public"]["Tables"]["communities"]["Row"] & {
  memberCount: number;
  eventCount: number;
};

export type UserData = {
  id: string;
  avatar_url?: string | null;
  full_name?: string | null;
} | null;

export type HubData = {
  communities: Community[];
  user: UserData;
};

/** Loader return shape (deferred) */
export type HubLoaderData = {
  data: Promise<HubData>;
};
