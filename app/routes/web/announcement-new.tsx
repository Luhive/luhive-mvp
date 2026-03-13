import { useParams, useNavigate, Link, useRouteLoaderData } from "react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import type { CommunityLoaderData } from "~/modules/community/server/community-loader.server";
import { toast } from "sonner";
import { createClient } from "~/shared/lib/supabase/client";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { createAnnouncementClient } from "~/modules/announcements/data/announcements-repo.client";
import { AnnouncementCompose } from "~/modules/announcements/components/announcement-compose";


export default function AnnouncementNewPage() {
  const { slug } = useParams<"slug">();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const parentData = useRouteLoaderData("routes/web/community") as CommunityLoaderData | undefined;
  const community = parentData?.community ?? null;
  const profile = parentData?.profile ?? null;

  const handleSubmit = async (payload: {
    title: string;
    description: string;
    coverImageUrl: string | null;
  }) => {
    if (!slug) {
      toast.error("Invalid community");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const [{ community }, { data: { user } }] = await Promise.all([
        getCommunityBySlugClient(slug),
        supabase.auth.getUser(),
      ]);

      if (!community || !user) {
        toast.error("Community not found or you must be signed in to publish");
        return;
      }

      const { announcement, error } = await createAnnouncementClient({
        communityId: community.id,
        createdBy: user.id,
        title: payload.title,
        description: payload.description,
        imageUrls: payload.coverImageUrl ? [payload.coverImageUrl] : [],
      });

      if (error || !announcement) {
        throw error ?? new Error("Failed to create announcement");
      }

      try {
        await fetch("/api/announcements/new-announcement-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            announcementId: announcement.id,
            communityId: community.id,
            communityName: community.name ?? "Community",
            communitySlug: community.slug,
            title: payload.title,
            description: payload.description,
            imageUrls: payload.coverImageUrl ? [payload.coverImageUrl] : [],
          }),
        });
      } catch (emailError) {
        console.error("Announcement email send failed", emailError);
      }

      toast.success("Announcement published");
      navigate(`/c/${community.slug}?published=1`);

    } catch (err) {
      console.error("Failed to publish announcement", err);
      toast.error("Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backTo = slug ? `/c/${slug}` : "/";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="w-full py-3 flex items-center justify-between gap-3">
          <Link
            to={backTo}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Back to community"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          {community && parentData ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 shrink-0 border border-foreground/20">
                <AvatarImage src={community.logo_url ?? undefined} alt={community.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {community.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{community.name}</p>
                {profile?.full_name ? (
                  <p className="text-sm text-muted-foreground truncate">{profile.full_name}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <Button
            type="submit"
            form="announcement-compose-form"
            className="min-w-[100px] shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <AnnouncementCompose
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onUploadingChange={setIsUploading}
        />
      </div>
    </div>
  );
}
