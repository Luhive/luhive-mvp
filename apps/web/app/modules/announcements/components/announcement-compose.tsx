import { useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "~/shared/lib/supabase/client";
import { Input } from "~/shared/components/ui/input";
import { Textarea } from "~/shared/components/ui/textarea";
import { Button } from "~/shared/components/ui/button";
import { CharacterCounter } from "~/modules/announcements/components/character-counter";

type AnnouncementComposeProps = {
  onSubmit: (payload: {
    title: string;
    description: string;
    coverImageUrl: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function AnnouncementCompose({ onSubmit, isSubmitting, onUploadingChange }: AnnouncementComposeProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);


  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = files[0];

    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    try {
      const extension = selected.name.split(".").pop() || "jpg";
      const filePath = `announcements/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("community-profile-pictures")
        .upload(filePath, selected, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data } = supabase.storage
        .from("community-profile-pictures")
        .getPublicUrl(filePath);

      setCoverImageUrl(data.publicUrl);
      toast.success("Cover image uploaded");
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Failed to upload cover image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    setDescription(el.value);
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (description.length > 1000) {
      toast.error("Description must be 1000 characters or less");
      return;
    }

    await onSubmit({ title: title.trim(), description: description.trim(), coverImageUrl });
  };

  return (
    <form
      id="announcement-compose-form"
      onSubmit={handleSubmit}
      className="flex flex-col"
    >
      {!coverImageUrl ? (
        <label className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleImageUpload(e.target.files)}
            disabled={isUploading}
            className="hidden"
          />
          <ImagePlus className="h-5 w-5 opacity-70" />
          <span className="text-sm font-medium opacity-70">
            {isUploading ? "Uploading..." : "Add Cover Photo"}
          </span>
        </label>
      ) : (
        <div className="relative group cursor-pointer overflow-hidden rounded-xl mb-6">
          <img
            src={coverImageUrl}
            alt={title || "Announcement cover"}
            className="h-64 sm:h-80 w-full object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setCoverImageUrl(null)}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/70 hover:bg-black/80 text-white hover:text-white h-7 w-7"
            aria-label="Remove cover photo"
          >
            <X className="h-4 w-4" />
          </Button>
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleImageUpload(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
            <span className="text-white font-medium text-lg">
              {isUploading ? "Uploading..." : "Change Cover Photo"}
            </span>
          </label>
        </div>
      )}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={180}
        className="border-0 shadow-none bg-transparent px-0 h-auto rounded-none !text-[30px] !leading-[125%] !font-semibold !text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0 mb-4"
      />

      <div className="relative">
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="What do you want to announce?"
          maxLength={1000}
          className="border-0 shadow-none bg-transparent px-0 pt-0 pb-6 pr-0 rounded-none min-h-[280px] !text-[16px] !leading-[150%] !font-medium !text-foreground/70 placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0 resize-none"
        />
        <div className="absolute bottom-2 right-0">
          <CharacterCounter current={description.length} max={1000} />
        </div>
      </div>
    </form>
  );
}
