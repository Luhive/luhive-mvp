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

interface CoverPictureUploadProps {
  communitySlug: string;
  currentCoverUrl?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
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

export function CoverPictureUpload({
  communitySlug,
  currentCoverUrl = '',
  onCoverUpdate
}: CoverPictureUploadProps) {
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

    // Validate file size (2MB limit like LinkedIn)
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
      const file = new File([croppedImageBlob], `cover-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Upload using object storage service
      const supabase = createClient();
      const fileExtension = 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `covers/${communitySlug}/${fileName}`;

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
        // Update database
        const { error: dbError } = await supabase
          .from('communities')
          .update({ cover_url: urlData.publicUrl })
          .eq('slug', communitySlug);

        if (dbError) {
          console.error('Database update error:', dbError);
          toast.error('Cover uploaded but failed to save to database');
        } else {
          setCurrentCover(urlData.publicUrl);
          toast.success('Cover picture updated successfully!');
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

  const handleRemoveCover = async () => {
    if (!currentCover) return;

    try {
      const supabase = createClient();
      
      // Update database to remove cover
      const { error: dbError } = await supabase
        .from('communities')
        .update({ cover_url: null })
        .eq('slug', communitySlug);

      if (dbError) {
        console.error('Database update error:', dbError);
        toast.error('Failed to remove cover picture');
      } else {
        setCurrentCover('');
        setIsDialogOpen(false);
        setSelectedImage(null);
        toast.success('Cover picture removed');
        onCoverUpdate('');
      }
    } catch (error) {
      console.error('Remove cover error:', error);
      toast.error('Failed to remove cover picture');
    }
  };

  if (!isClient) {
    return (
      <div className="relative w-full h-36 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background" />
    );
  }

  return (
    <>
      {/* Cover Picture Display */}
      <div className="relative w-full h-36 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background overflow-hidden">
        {currentCover ? (
          <img
            src={currentCover}
            alt="Community Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}

        {/* Edit Button - Top Right */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                htmlFor="cover-upload"
                className="absolute top-3 right-3 cursor-pointer group/edit"
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group-hover/edit:bg-primary group-hover/edit:text-primary-foreground"
                  type="button"
                  asChild
                >
                  <span>
                    <ImageUp className="h-4 w-4 group-hover/edit:text-primary transition-transform duration-200 group-hover/edit:scale-110" />
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
            <TooltipContent side="left" className="bg-popover rounded-md border border-border shadow-lg">
              <p className="text-sm text-foreground font-medium">
                {currentCover ? 'Change cover picture' : 'Upload cover picture'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Cover Picture</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-[400px] bg-muted">
            {selectedImage && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>}>
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  objectFit="horizontal-cover"
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
                variant="destructive"
                onClick={handleRemoveCover}
                disabled={isUploading}
                className="sm:mr-auto"
              >
                <X className="h-4 w-4 mr-2" />
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
                'Save Cover Picture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

