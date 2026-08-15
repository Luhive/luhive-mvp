import { useState, useCallback, useEffect } from "react";
import { Button } from "~/shared/components/ui/button";
import { ImageCropDialog } from "~/shared/components/image-crop-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/shared/components/ui/tooltip";
import { toast } from "sonner";
import { ImageUp } from "lucide-react";
import { createClient } from "~/shared/lib/supabase/client";
import { getCroppedImg, type CroppedAreaPixels } from "~/shared/lib/utils/image-crop";

interface CoverPictureUploadProps {
  communitySlug: string;
  currentCoverUrl?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
}

export function CoverPictureUpload({
  communitySlug,
  currentCoverUrl = "",
  onCoverUpdate,
}: CoverPictureUploadProps) {
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
      const file = new File([croppedImageBlob], `cover-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const supabase = createClient();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `covers/${communitySlug}/${fileName}`;

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
        const { error: dbError } = await supabase
          .from("communities")
          .update({ cover_url: urlData.publicUrl })
          .eq("slug", communitySlug);

        if (dbError) {
          console.error("Database update error:", dbError);
          toast.error("Cover uploaded but failed to save to database");
        } else {
          setCurrentCover(urlData.publicUrl);
          toast.success("Cover picture updated successfully!");
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

  const handleRemoveCover = async () => {
    if (!currentCover) return;

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("communities")
        .update({ cover_url: null })
        .eq("slug", communitySlug);

      if (dbError) {
        console.error("Database update error:", dbError);
        toast.error("Failed to remove cover picture");
      } else {
        setCurrentCover("");
        setIsDialogOpen(false);
        setSelectedImage(null);
        toast.success("Cover picture removed");
        onCoverUpdate("");
      }
    } catch (error) {
      console.error("Remove cover error:", error);
      toast.error("Failed to remove cover picture");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
  };

  if (!isClient) {
    return (
      <div className="relative w-full aspect-[4/1] max-h-32 sm:max-h-36 md:max-h-40 lg:max-h-44 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background" />
    );
  }

  return (
    <>
      <div>
        <div className="relative w-full aspect-[4/1] max-h-32 sm:max-h-36 md:max-h-40 lg:max-h-44 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background overflow-hidden">
          {currentCover ? (
            <img
              src={currentCover}
              alt="Community Cover"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full" />
          )}

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  htmlFor="cover-upload"
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 cursor-pointer group/edit"
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group-hover/edit:bg-primary group-hover/edit:text-primary-foreground"
                    type="button"
                    asChild
                  >
                    <span>
                      <ImageUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover/edit:text-primary transition-transform duration-200 group-hover/edit:scale-110" />
                    </span>
                  </Button>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-popover rounded-md border border-border shadow-lg"
              >
                <p className="text-sm text-foreground font-medium">
                  {currentCover ? "Change cover picture" : "Upload cover picture"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ImageCropDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        imageSrc={selectedImage}
        aspect={4 / 1}
        title="Crop Cover Picture"
        hint="Recommended: 1584 x 396 px (Linkedin Cover)"
        objectFit="horizontal-cover"
        isProcessing={isUploading}
        uploadProgress={uploadProgress}
        hasCurrentImage={!!currentCover}
        onSave={handleCropConfirm}
        onCancel={handleCancel}
        onRemove={handleRemoveCover}
        onCropComplete={onCropComplete}
        saveLabel="Save Cover Picture"
        removeLabel="Remove Cover"
      />
    </>
  );
}
