import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useRevalidator } from "react-router";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import { uploadProfileAvatar } from "~/modules/profile/data/profile-avatar-repo.client";

const Cropper = lazy(() =>
  import("react-easy-crop").then((module) => ({ default: module.default }))
);

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.95
    );
  });
}

interface ProfileAvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileAvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
}: ProfileAvatarUploadProps) {
  const [isClient, setIsClient] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const revalidator = useRevalidator();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setPreviewUrl(currentAvatarUrl ?? null);
  }, [currentAvatarUrl]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsDialogOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const blob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const result = await uploadProfileAvatar(userId, blob);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setPreviewUrl(result.url);
        toast.success("Avatar updated successfully!");
        setIsDialogOpen(false);
        setSelectedImage(null);
        revalidator.revalidate();
      } else {
        toast.error(result.error ?? "Upload failed");
      }
    } catch {
      clearInterval(progressInterval);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center shrink-0">
        <Avatar className="h-24 w-24 border-2">
          <AvatarImage src={currentAvatarUrl ?? undefined} alt={userName ?? "User"} />
          <AvatarFallback className="bg-gradient-avatar text-xl font-semibold">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <>
      <div className="flex shrink-0 justify-center">
        <div className="relative h-24 w-24">
          <Avatar className="h-24 w-24 border-2">
            <AvatarImage src={previewUrl ?? undefined} alt={userName ?? "User"} />
            <AvatarFallback className="bg-gradient-avatar text-xl font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <span className="text-xs font-medium text-white">{uploadProgress}%</span>
            </div>
          )}

          <label
            htmlFor="avatar-upload"
            className={`absolute -bottom-1 -right-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full shadow-lg transition-colors ${
              isUploading
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isUploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-72 bg-muted rounded-md overflow-hidden">
            {selectedImage && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Spinner className="h-8 w-8" />
                  </div>
                }
              >
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </Suspense>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedImage(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={isUploading || !croppedAreaPixels}
            >
              {isUploading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Uploading...
                </>
              ) : (
                "Save Picture"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
