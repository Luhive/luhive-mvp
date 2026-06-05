import { useState, useCallback, useEffect } from "react";
import { Button } from "~/shared/components/ui/button";
import { ImageCropDialog } from "~/shared/components/image-crop-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/shared/components/ui/tooltip";
import { toast } from "sonner";
import { ImageUp } from "lucide-react";
import { createClient } from "~/shared/lib/supabase/client";
import { getCroppedImg, type CroppedAreaPixels } from "~/shared/lib/utils/image-crop";

interface EventCoverUploadProps {
  communitySlug: string;
  eventId?: string;
  currentCoverUrl?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
  isCreating?: boolean;
}

export function EventCoverUpload({
  communitySlug,
  eventId,
  currentCoverUrl = "",
  onCoverUpdate,
  isCreating = false,
}: EventCoverUploadProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentCover, setCurrentCover] = useState(currentCoverUrl);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentCover(currentCoverUrl);
  }, [currentCoverUrl]);

  const onCropComplete = useCallback((pixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsDialogOpen(true);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const file = new File([croppedImageBlob], `event-cover-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const supabase = createClient();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `events/${communitySlug}/${fileName}`;

      const { error } = await supabase.storage
        .from("community-profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error("Upload error:", error);
        toast.error(error.message || "Upload failed");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("community-profile-pictures")
        .getPublicUrl(filePath);

      if (urlData.publicUrl) {
        if (!isCreating && eventId) {
          const { error: dbError } = await supabase
            .from("events")
            .update({ cover_url: urlData.publicUrl })
            .eq("id", eventId);

          if (dbError) {
            console.error("Database update error:", dbError);
            toast.error("Cover uploaded but failed to save to database");
          } else {
            setCurrentCover(urlData.publicUrl);
            toast.success("Event cover updated successfully!");
            setIsDialogOpen(false);
            setSelectedImage(null);
            onCoverUpdate(urlData.publicUrl);
          }
        } else {
          setCurrentCover(urlData.publicUrl);
          toast.success("Event cover selected!");
          setIsDialogOpen(false);
          setSelectedImage(null);
          onCoverUpdate(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error("Crop/Upload error:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveCover = () => {
    setCurrentCover("");
    setIsDialogOpen(false);
    setSelectedImage(null);
    toast.success("Event cover removed");
    onCoverUpdate("");
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
  };

  if (!isClient) {
    return (
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background rounded-lg" />
    );
  }

  return (
    <>
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background overflow-hidden rounded-lg border">
        {currentCover ? (
          <img
            src={currentCover}
            alt="Event Cover"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <ImageUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Event Cover</p>
            </div>
          </div>
        )}

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                htmlFor="event-cover-upload"
                className="absolute inset-0 cursor-pointer group/edit flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all duration-200"
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full shadow-lg opacity-0 group-hover/edit:opacity-100 transition-all duration-200 hover:scale-110"
                  type="button"
                  asChild
                >
                  <span>
                    <ImageUp className="h-5 w-5" />
                  </span>
                </Button>
                <input
                  id="event-cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover rounded-md border border-border shadow-lg"
            >
              <p className="text-sm text-foreground font-medium">
                {currentCover ? "Change event cover" : "Upload event cover"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ImageCropDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        imageSrc={selectedImage}
        aspect={1}
        title="Crop Event Cover"
        hint="Square format (1:1 ratio) - Recommended: 800 x 800 px"
        objectFit="contain"
        isProcessing={isUploading}
        uploadProgress={uploadProgress}
        hasCurrentImage={!!currentCover}
        onSave={handleCropConfirm}
        onCancel={handleCancel}
        onRemove={handleRemoveCover}
        onCropComplete={onCropComplete}
        saveLabel="Save Cover"
        removeLabel="Remove Cover"
        dialogClassName="max-w-2xl"
      />
    </>
  );
}
