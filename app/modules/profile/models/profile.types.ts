import type { Profile } from "~/shared/models/entity.types";

export type ProfileCommunityItem = {
  role: string;
  memberCount: number;
  community: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    verified: boolean | null;
  };
};

export type ProfileEventItem = {
  rsvp_status: string;
  event: {
    id: string;
    title: string;
    slug: string | null;
    start_time: string;
    end_time: string | null;
    event_type: string;
    community_id: string;
  };
};

export type ProfileSocialLinks = {
  linkedin?: string;
  twitter?: string;
};

export type ProfileLoaderData = {
  user: Profile | null;
  communities: ProfileCommunityItem[];
  events: ProfileEventItem[];
};
