import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AnnouncementForm } from "~/modules/announcements/components/announcement-form";
import { createAnnouncementClient } from "~/modules/announcements/data/announcements-repo.client";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";

export default function DashboardAnnouncementCreatePage() {
  const navigate = useNavigate();
  const dashboardData = useDashboardContext();

  const handleSubmit = async (payload: { title: string; description: string; imageUrls: string[] }) => {
    const { announcement, error } = await createAnnouncementClient({
      communityId: dashboardData.community.id,
      createdBy: dashboardData.user.id,
      title: payload.title,
      description: payload.description,
      imageUrls: payload.imageUrls,
    });

    if (error || !announcement) {
      toast.error(error?.message || "Failed to create announcement");
      return;
    }

    try {
      await fetch("/api/announcements/new-announcement-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: announcement.id,
          communityId: dashboardData.community.id,
          communityName: dashboardData.community.name,
          title: announcement.title,
          description: announcement.description,
          imageUrls: payload.imageUrls,
          communitySlug: dashboardData.community.slug,
        }),
      });
    } catch (emailError) {
      console.error("Announcement email send failed", emailError);
    }

    toast.success("Announcement created and email notifications started");
    navigate(`/dashboard/${dashboardData.community.slug}/announcements`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create Announcement</h1>
          <p className="text-sm text-muted-foreground">Members will receive this announcement by email once published.</p>
        </div>
        <AnnouncementForm submitLabel="Publish Announcement" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
