import type { Community, UserData } from "~/modules/hub/model/hub-types";

export type HubEventSummary = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  startTime: string;
  endTime: string | null;
  timezone: string;
  locationName: string | null;
  communitySlug: string;
  communityName: string;
};

/** Loader return shape for /hubv2; each section streams independently. */
export type HubV2LoaderData = {
  viewer: Promise<UserData>;
  communities: Promise<Community[]>;
  upcomingEvents: Promise<HubEventSummary[]>;
  pastEvents: Promise<HubEventSummary[]>;
};
