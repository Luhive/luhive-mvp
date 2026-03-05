import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "~/shared/components/ui/dialog";
import { Drawer, DrawerContent, DrawerClose } from "~/shared/components/ui/drawer";
import { Button } from "~/shared/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "~/shared/lib/supabase/client";
import { useIsMobile } from "~/shared/hooks/use-mobile";

type AnnouncementModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communitySlug: string;
  createdBy: string;
  communityName?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function AnnouncementModal({
  open,
  onOpenChange,
  communityId,
  communitySlug,
  createdBy,
  communityName = "Community",
}: AnnouncementModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setCoverImageUrl(null);
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = files[0];

    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Each image must be less than 5MB");
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
      const filePath = `announcements/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("community-profile-pictures")
        .upload(filePath, selected, { cacheControl: "3600", upsert: false });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from("community-profile-pictures")
        .getPublicUrl(filePath);

      setCoverImageUrl(data.publicUrl);
      toast.success("Cover image uploaded");
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error("Failed to upload cover image");
    } finally {
      setIsUploading(false);
    }
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

    setIsSubmitting(true);
    try {
      const { createAnnouncementClient } = await import(
        "~/modules/announcements/data/announcements-repo.client"
      );

      const { announcement, error } = await createAnnouncementClient({
        communityId,
        createdBy,
        title: title.trim(),
        description: description.trim(),
        imageUrls: coverImageUrl ? [coverImageUrl] : [],
      });

      if (error) {
        throw error;
      }

      await fetch("/api/announcements/new-announcement-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcementId: announcement?.id,
          communityId,
          communityName,
          communitySlug,
          title: title.trim(),
          description: description.trim(),
          imageUrls: coverImageUrl ? [coverImageUrl] : [],
        }),
      });

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to publish announcement", error);
      toast.error("Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="flex min-h-[520px] flex-col px-6 py-5 sm:px-8 sm:py-7">
      <div className="flex-1 space-y-4">
        {coverImageUrl ? (
          <div className="relative group cursor-pointer rounded-[9.45px] overflow-hidden">
            <img
              src={coverImageUrl}
              alt={title || "Announcement cover"}
              className="h-65 w-full object-cover object-[20%_70%] md:object-[20%_60%]"
            />
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={isUploading}
                className="hidden"
              />
              <span className="text-white font-medium text-lg">Change Cover Photo</span>
            </label>
          </div>
        ) : null}

        <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={180}
        className="w-full border-0 bg-transparent p-0 font-bold text-[30px] leading-[125%] tracking-[0] font-semibold placeholder:text-muted-foreground/70 outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What do you want to announce?"
        className="min-h-[220px] w-full border-0 bg-transparent p-0 font-medium text-[18px] leading-[150%] tracking-[0] placeholder:text-muted-foreground/70 outline-none resize-none"
      />
      </div>

      <div className="mt-6 flex w-full items-center justify-between border-t pt-5">
        {!coverImageUrl && (
          <label className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleImageUpload(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
            <ImagePlus className="h-5 w-5" />
            <span className="text-sm font-medium">Add Cover Photo</span>
          </label>
        )}

        <div className={`flex gap-3 ${coverImageUrl ? 'ml-auto' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="min-w-[88px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="min-w-[88px] bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background">
          <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[620px] rounded-[28px] p-0 gap-0 overflow-hidden border">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
