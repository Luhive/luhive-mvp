export { loader } from '~/modules/announcements/server/announcement-detail-loader.server';

import { useLoaderData, Link } from 'react-router';
import { ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '~/shared/components/ui/button';
import type { AnnouncementDetailLoaderData } from '~/modules/announcements/server/announcement-detail-loader.server';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

export default function AnnouncementDetail() {
  const { announcement, community } = useLoaderData<AnnouncementDetailLoaderData>();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);

  if (!announcement || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Announcement not found</h1>
          <Button asChild variant="outline">
            <Link to={`/c/${community?.slug || ''}`}>
              Back to community
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasImages = announcement.images && announcement.images.length > 0;
  const createdDate = new Date(announcement.created_at);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${community.slug}/announcements/${announcement.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: announcement.description.substring(0, 100),
          url,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/c/${community.slug}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold truncate">{community.name}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Images */}
          {hasImages ? (
            <div className="space-y-4">
              <Swiper
                modules={[Navigation, Pagination, Thumbs]}
                spaceBetween={10}
                navigation
                pagination={{ clickable: true }}
                thumbs={{ swiper: thumbsSwiper }}
                className="h-96 w-full rounded-lg overflow-hidden bg-muted"
              >
                {announcement.images.map((image) => (
                  <SwiperSlide key={image.id}>
                    <img
                      src={image.image_url}
                      alt={announcement.title}
                      className="h-full w-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Thumbnails */}
              {announcement.images.length > 1 && (
                <Swiper
                  modules={[Thumbs]}
                  spaceBetween={8}
                  slidesPerView={4}
                  onSwiper={setThumbsSwiper}
                  className="h-20"
                >
                  {announcement.images.map((image) => (
                    <SwiperSlide key={image.id} className="cursor-pointer">
                      <img
                        src={image.image_url}
                        alt={announcement.title}
                        className="h-20 w-full object-cover rounded border border-muted-foreground/20 hover:border-foreground/50 transition-colors"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          ) : (
            <div className="h-96 rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No images for this announcement</p>
              </div>
            </div>
          )}

          {/* Right Side - Content */}
          <div className="space-y-6 flex flex-col justify-start">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                {announcement.title}
              </h1>

              <Button
                variant="outline"
                size="sm"
                className="w-fit"
              >
                <time dateTime={announcement.created_at} className="text-xs">
                  {formattedDate}
                </time>
              </Button>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {announcement.description}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex gap-3">
              <Button
                asChild
                variant="outline"
              >
                <Link to={`/c/${community.slug}`}>
                  View Community
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
