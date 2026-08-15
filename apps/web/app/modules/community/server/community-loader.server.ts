import type { CommunityLayoutLoaderData } from "~/modules/community/server/community-layout-loader.server";
import type { CommunityHomeLoaderData } from "~/modules/community/server/community-home-loader.server";

export type { CommunityLayoutLoaderData } from "~/modules/community/server/community-layout-loader.server";
export type { CommunityHomeLoaderData } from "~/modules/community/server/community-home-loader.server";

/** Merged loader shape used by the community homepage. */
export type CommunityLoaderData = CommunityLayoutLoaderData &
  CommunityHomeLoaderData;
