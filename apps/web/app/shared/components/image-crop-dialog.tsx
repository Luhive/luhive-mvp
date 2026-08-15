import { useState, useCallback, lazy, Suspense } from "react";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/shared/components/ui/dialog";
import type { CroppedAreaPixels } from "~/shared/lib/utils/image-crop";

const Cropper = lazy(() =>
  import("react-easy-crop").then((module) => ({ default: module.default }))
);

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  aspect: number;
  title: string;
  hint?: string;
  objectFit?: "contain" | "horizontal-cover" | "vertical-cover";
  isProcessing: boolean;
  uploadProgress: number;
  hasCurrentImage?: boolean;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
  onCropComplete: (croppedAreaPixels: CroppedAreaPixels) => void;
  saveLabel?: string;
  removeLabel?: string;
  dialogClassName?: string;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  title,
  hint,
  objectFit = "contain",
  isProcessing,
  uploadProgress,
  hasCurrentImage = false,
  onSave,
  onCancel,
  onRemove,
  onCropComplete,
  saveLabel = "Save",
  removeLabel = "Remove",
  dialogClassName = "max-w-3xl",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CroppedAreaPixels) => {
      onCropComplete(croppedAreaPixels);
    },
    [onCropComplete]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isProcessing) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </DialogHeader>

        <div className="relative w-full h-[400px] bg-muted">
          {imageSrc ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Spinner className="h-8 w-8" />
                </div>
              }
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                objectFit={objectFit}
              />
            </Suspense>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            disabled={isProcessing}
          />
        </div>

        {isProcessing ? (
          <div className="space-y-2">
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
        ) : null}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasCurrentImage && onRemove ? (
            <Button
              variant="link"
              onClick={onRemove}
              disabled={isProcessing}
              className="sm:mr-auto text-destructive text-sm pl-0"
            >
              {removeLabel}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isProcessing || !imageSrc}>
            {isProcessing ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Uploading...
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
