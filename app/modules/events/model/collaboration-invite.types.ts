import type { Database } from "~/shared/models/database.types";

export type CollaborationInviteActionData = {
  success: boolean;
  error?: string;
};

type CommunityCard = Pick<
  Database["public"]["Tables"]["communities"]["Row"],
  "id" | "name" | "slug" | "logo_url"
>;

export type CollaborationInviteEventPreview = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  | "id"
  | "title"
  | "start_time"
  | "end_time"
  | "location_address"
  | "community_id"
  | "created_by"
  | "created_at"
  | "online_meeting_link"
> & {
  location_name?: string | null;
};

export type CollaborationInviteLoaderData = {
  collaboration: Database["public"]["Tables"]["event_collaborations"]["Row"] & {
    event?: CollaborationInviteEventPreview | CollaborationInviteEventPreview[] | null;
    community?: CommunityCard | CommunityCard[] | null;
  };
  event: CollaborationInviteEventPreview;
  coHostCommunity: CommunityCard;
  hostCommunity: CommunityCard;
  status: string;
};
