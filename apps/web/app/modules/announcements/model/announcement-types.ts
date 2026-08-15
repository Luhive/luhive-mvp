export type AnnouncementImage = {
  id: string;
  announcement_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string;
};

export type Announcement = {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string;
  published: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  images?: AnnouncementImage[];
  viewCount?: number;
};

export type AnnouncementUpsertInput = {
  communityId: string;
  createdBy: string;
  title: string;
  description: string;
  imageUrls: string[];
};
