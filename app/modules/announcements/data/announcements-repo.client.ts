import { createClient } from "~/shared/lib/supabase/client";
import type { Announcement, AnnouncementUpsertInput } from "~/modules/announcements/model/announcement-types";

export async function getAnnouncementsByCommunityClient(communityId: string) {
  const supabase = createClient();
  const db = supabase as any;

  const { data: announcements, error } = await db
    .from("community_announcements")
    .select("*")
    .eq("community_id", communityId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { announcements: [] as Announcement[], error };
  }

  const announcementIds = (announcements || []).map((item: any) => item.id);
  if (announcementIds.length === 0) {
    return { announcements: [] as Announcement[], error: null };
  }

  const { data: images, error: imageError } = await db
    .from("community_announcement_images")
    .select("*")
    .in("announcement_id", announcementIds)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return { announcements: [] as Announcement[], error: imageError };
  }

  const imageMap = new Map<string, any[]>();
  for (const image of images || []) {
    const existing = imageMap.get(image.announcement_id) || [];
    existing.push(image);
    imageMap.set(image.announcement_id, existing);
  }

  const normalized: Announcement[] = (announcements || []).map((announcement: any) => ({
    ...announcement,
    images: imageMap.get(announcement.id) || [],
  }));

  return { announcements: normalized, error: null };
}

export async function getDashboardAnnouncementsClient(communityId: string) {
  const supabase = createClient();
  const db = supabase as any;

  const { data: announcements, error } = await db
    .from("community_announcements")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    return { announcements: [] as Announcement[], error };
  }

  const announcementIds = (announcements || []).map((item: any) => item.id);
  if (announcementIds.length === 0) {
    return { announcements: [] as Announcement[], error: null };
  }

  const { data: images, error: imageError } = await db
    .from("community_announcement_images")
    .select("*")
    .in("announcement_id", announcementIds)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return { announcements: [] as Announcement[], error: imageError };
  }

  const imageMap = new Map<string, any[]>();
  for (const image of images || []) {
    const existing = imageMap.get(image.announcement_id) || [];
    existing.push(image);
    imageMap.set(image.announcement_id, existing);
  }

  const normalized: Announcement[] = (announcements || []).map((announcement: any) => ({
    ...announcement,
    images: imageMap.get(announcement.id) || [],
  }));

  return { announcements: normalized, error: null };
}

export async function getAnnouncementByIdClient(announcementId: string) {
  const supabase = createClient();
  const db = supabase as any;

  const { data: announcement, error } = await db
    .from("community_announcements")
    .select("*")
    .eq("id", announcementId)
    .single();

  if (error || !announcement) {
    return { announcement: null as Announcement | null, error };
  }

  const { data: images, error: imageError } = await db
    .from("community_announcement_images")
    .select("*")
    .eq("announcement_id", announcementId)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return { announcement: null as Announcement | null, error: imageError };
  }

  return {
    announcement: {
      ...announcement,
      images: images || [],
    } as Announcement,
    error: null,
  };
}

export async function createAnnouncementClient(input: AnnouncementUpsertInput) {
  const supabase = createClient();
  const db = supabase as any;

  const { data: announcement, error } = await db
    .from("community_announcements")
    .insert({
      community_id: input.communityId,
      created_by: input.createdBy,
      title: input.title,
      description: input.description,
      published: true,
    })
    .select("*")
    .single();

  if (error || !announcement) {
    return { announcement: null as Announcement | null, error };
  }

  if (input.imageUrls.length > 0) {
    const imageRows = input.imageUrls.map((imageUrl, index) => ({
      announcement_id: announcement.id,
      image_url: imageUrl,
      sort_order: index,
    }));

    const { error: imageError } = await db
      .from("community_announcement_images")
      .insert(imageRows);

    if (imageError) {
      return { announcement: null as Announcement | null, error: imageError };
    }
  }

  return {
    announcement: {
      ...announcement,
      images: input.imageUrls.map((url, index) => ({
        id: `${announcement.id}-${index}`,
        announcement_id: announcement.id,
        image_url: url,
        storage_path: null,
        sort_order: index,
        created_at: new Date().toISOString(),
      })),
    } as Announcement,
    error: null,
  };
}

export async function updateAnnouncementClient(
  announcementId: string,
  input: Omit<AnnouncementUpsertInput, "communityId" | "createdBy">
) {
  const supabase = createClient();
  const db = supabase as any;

  const { data: announcement, error } = await db
    .from("community_announcements")
    .update({
      title: input.title,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", announcementId)
    .select("*")
    .single();

  if (error || !announcement) {
    return { announcement: null as Announcement | null, error };
  }

  const { error: deleteError } = await db
    .from("community_announcement_images")
    .delete()
    .eq("announcement_id", announcementId);

  if (deleteError) {
    return { announcement: null as Announcement | null, error: deleteError };
  }

  if (input.imageUrls.length > 0) {
    const imageRows = input.imageUrls.map((imageUrl, index) => ({
      announcement_id: announcement.id,
      image_url: imageUrl,
      sort_order: index,
    }));

    const { error: imageError } = await db
      .from("community_announcement_images")
      .insert(imageRows);

    if (imageError) {
      return { announcement: null as Announcement | null, error: imageError };
    }
  }

  return {
    announcement: {
      ...announcement,
      images: input.imageUrls.map((url, index) => ({
        id: `${announcement.id}-${index}`,
        announcement_id: announcement.id,
        image_url: url,
        storage_path: null,
        sort_order: index,
        created_at: new Date().toISOString(),
      })),
    } as Announcement,
    error: null,
  };
}
