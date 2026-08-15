import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { AnnouncementCompose } from "~/modules/announcements/components/announcement-compose";
import { createAnnouncementClient } from "~/modules/announcements/data/announcements-repo.client";
import { useDashboardHeaderActions } from "~/modules/dashboard/components/dashboard-header-actions";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";

export default function DashboardAnnouncementsNewPage() {
  const { community, user } = useDashboardContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useDashboardHeaderActions(
    <Button
      type="submit"
      form="announcement-compose-form"
      disabled={isSubmitting || isUploading}
    >
      {isSubmitting ? "Publishing..." : "Publish"}
    </Button>,
    [isSubmitting, isUploading],
  );

  const handleSubmit = async (payload: {
    title: string;
    description: string;
    coverImageUrl: string | null;
  }) => {
    setIsSubmitting(true);
    try {
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
      navigate(`/dashboard/${community.slug}/announcements`);
    } catch (err) {
      console.error("Failed to publish announcement", err);
      toast.error("Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <AnnouncementCompose
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onUploadingChange={setIsUploading}
        />
      </div>
    </div>
  );
}
