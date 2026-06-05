import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Spinner } from "~/shared/components/ui/spinner";
import { ImageCropDialog } from "~/shared/components/image-crop-dialog";
import { uploadCommunityLogo } from "~/shared/lib/storage/object-storage.client";
import { getCroppedImg, type CroppedAreaPixels } from "~/shared/lib/utils/image-crop";
import { createClient } from "~/shared/lib/supabase/client";
import { toast } from "sonner";
import { Camera } from "lucide-react";

interface ProfilePictureUploadProps {
  communitySlug: string;
  currentLogoUrl?: string;
  communityName: string;
  onLogoUpdate: (newLogoUrl: string) => void;
}

export function ProfilePictureUpload({
  communitySlug,
  currentLogoUrl = "",
  communityName,
  onLogoUpdate,
}: ProfilePictureUploadProps) {
  const [previewImage, setPreviewImage] = useState<string>(currentLogoUrl);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setPreviewImage(currentLogoUrl);
  }, [currentLogoUrl]);

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
      const file = new File([croppedImageBlob], `logo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const result = await uploadCommunityLogo(file, communitySlug);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setPreviewImage(result.url);
        onLogoUpdate(result.url);

        try {
          const supabase = createClient();
          const { error: dbError } = await supabase
            .from("communities")
            .update({ logo_url: result.url })
            .eq("slug", communitySlug);

          if (dbError) {
            console.error("Database update error:", dbError);
            toast.error("Logo uploaded but failed to save to database");
          } else {
            toast.success("Logo uploaded and saved successfully!");
            setIsDialogOpen(false);
            setSelectedImage(null);
          }
        } catch (dbError) {
          console.error("Database update error:", dbError);
          toast.error("Logo uploaded but failed to save to database");
        }
      } else {
        toast.error(result.error || "Upload failed");
        setPreviewImage(currentLogoUrl);
      }
    } catch (error) {
      toast.error("Failed to process image. Please try again.");
      console.error(error);
      setPreviewImage(currentLogoUrl);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-1">
            <AvatarImage src={currentLogoUrl} alt={communityName} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {communityName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-2 text-center">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-1">
            <AvatarImage src={previewImage} alt={communityName} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {communityName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isUploading ? (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="text-white text-xs font-medium">{uploadProgress}%</div>
            </div>
          ) : null}

          <label
            htmlFor="profile-upload"
            className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors shadow-lg ${
              isUploading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isUploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              id="profile-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading ? (
          <div className="mt-2 text-center">
            <div className="text-sm text-muted-foreground">Uploading...</div>
            <div className="w-32 bg-muted rounded-full h-1 mt-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <div className="text-xs text-muted-foreground">
              Click camera icon to change logo
            </div>
          </div>
        )}
      </div>

      <ImageCropDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        imageSrc={selectedImage}
        aspect={1}
        title="Crop Profile Picture"
        hint="Square format (1:1 ratio) - Recommended: 400 x 400 px"
        objectFit="contain"
        isProcessing={isUploading}
        uploadProgress={uploadProgress}
        onSave={handleCropConfirm}
        onCancel={handleCancel}
        onCropComplete={onCropComplete}
        saveLabel="Save Profile Picture"
        dialogClassName="max-w-2xl"
      />
    </>
  );
}
