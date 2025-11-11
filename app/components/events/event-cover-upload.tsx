import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { toast } from 'sonner';
import { ImageUp, X } from 'lucide-react';
import { createClient } from '~/lib/supabase.client';

// Lazy load Cropper component to avoid SSR issues
const Cropper = lazy(() => import('react-easy-crop').then(module => ({ default: module.default })));

interface EventCoverUploadProps {
  communitySlug: string;
  eventId?: string;
  currentCoverUrl?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
  isCreating?: boolean; // If true, we're in creation mode, don't update DB
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedAreaPixels extends Area {}

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

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
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.95);
  });
}

export function EventCoverUpload({
  communitySlug,
  eventId,
  currentCoverUrl = '',
  onCoverUpdate,
  isCreating = false
}: EventCoverUploadProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
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

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
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

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Get cropped image blob
      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      // Convert blob to file
      const file = new File([croppedImageBlob], `event-cover-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Upload using Supabase storage
      const supabase = createClient();
      const fileExtension = 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `events/${communitySlug}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('community-profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Upload error:', error);
        toast.error(error.message || 'Upload failed');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('community-profile-pictures')
        .getPublicUrl(filePath);

      if (urlData.publicUrl) {
        // If not in creation mode and we have an eventId, update the database
        if (!isCreating && eventId) {
          const { error: dbError } = await supabase
            .from('events')
            .update({ cover_url: urlData.publicUrl })
            .eq('id', eventId);

          if (dbError) {
            console.error('Database update error:', dbError);
            toast.error('Cover uploaded but failed to save to database');
          } else {
            setCurrentCover(urlData.publicUrl);
            toast.success('Event cover updated successfully!');
            setIsDialogOpen(false);
            setSelectedImage(null);
            onCoverUpdate(urlData.publicUrl);
          }
        } else {
          // In creation mode, just pass the URL to parent
          setCurrentCover(urlData.publicUrl);
          toast.success('Event cover selected!');
          setIsDialogOpen(false);
          setSelectedImage(null);
          onCoverUpdate(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error('Crop/Upload error:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveCover = () => {
    setCurrentCover('');
    setIsDialogOpen(false);
    setSelectedImage(null);
    toast.success('Event cover removed');
    onCoverUpdate('');
  };

  if (!isClient) {
    return (
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background rounded-lg" />
    );
  }

  return (
    <>
      {/* Event Cover Display - Square */}
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

        {/* Edit Button - Center */}
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
            <TooltipContent side="right" className="bg-popover rounded-md border border-border shadow-lg">
              <p className="text-sm text-foreground font-medium">
                {currentCover ? 'Change event cover' : 'Upload event cover'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Event Cover</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Square format (1:1 ratio) - Recommended: 800 x 800 px
            </p>
          </DialogHeader>

          <div className="relative w-full h-[400px] bg-muted">
            {selectedImage && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>}>
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  objectFit="contain"
                />
              </Suspense>
            )}
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
            />
          </div>

          {isUploading && (
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
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {currentCover && (
              <Button
                variant="link"
                onClick={handleRemoveCover}
                disabled={isUploading}
                className="sm:mr-auto text-destructive text-sm pl-0"
              >
                Remove Cover
              </Button>
            )}
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
                'Save Cover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

