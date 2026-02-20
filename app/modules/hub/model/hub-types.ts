import type { Community as BaseCommunity } from "~/shared/models/entity.types";

export type Community = BaseCommunity & {
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
