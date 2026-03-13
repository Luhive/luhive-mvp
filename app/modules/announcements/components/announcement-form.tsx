import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { createClient } from "~/shared/lib/supabase/client";

type AnnouncementFormProps = {
  initialTitle?: string;
  initialDescription?: string;
  initialImageUrls?: string[];
  submitLabel: string;
  onSubmit: (payload: { title: string; description: string; imageUrls: string[] }) => Promise<void>;
};

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function AnnouncementForm({
  initialTitle = "",
  initialDescription = "",
  initialImageUrls = [],
  submitLabel,
  onSubmit,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = Array.from(files);
    if (imageUrls.length + selected.length > MAX_IMAGES) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    const invalidSize = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (invalidSize) {
      toast.error("Each image must be less than 5MB");
      return;
    }

    const invalidType = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (invalidType) {
      toast.error("Only JPG, PNG, or WebP images are allowed");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    try {
      for (const file of selected) {
        const extension = file.name.split(".").pop() || "jpg";
        const filePath = `announcements/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

        const { error } = await supabase.storage
          .from("community-profile-pictures")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (error) {
          throw error;
        }

        const { data } = supabase.storage
          .from("community-profile-pictures")
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success("Images uploaded");
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error("Failed to upload one or more images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), imageUrls });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Announcement title"
          maxLength={180}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Write your announcement details"
          rows={6}
          required
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="images">Images (up to 5)</Label>
        <Input
          id="images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(event) => {
            handleImageUpload(event.target.files);
            event.target.value = "";
          }}
          disabled={isUploading || imageUrls.length >= MAX_IMAGES}
        />
        {isUploading ? (
          <p className="text-xs text-muted-foreground">Uploading images...</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Max 5 images, 5MB each.
          </p>
        )}

        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative rounded-md border overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Announcement image ${index + 1}`}
                  className="h-28 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || isUploading}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
