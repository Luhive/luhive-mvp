import { uploadProfileAvatarFile } from "~/shared/lib/storage/object-storage.client";
import { createClient } from "~/shared/lib/supabase/client";

export async function uploadProfileAvatar(
  userId: string,
  file: Blob
): Promise<{ success: boolean; url?: string; error?: string }> {
  const uploadResult = await uploadProfileAvatarFile(file, userId);

  if (!uploadResult.success || !uploadResult.url) {
    return { success: false, error: uploadResult.error ?? "Upload failed" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: uploadResult.url })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, url: uploadResult.url };
}
