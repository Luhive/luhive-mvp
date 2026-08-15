import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { toast } from "sonner";
import { AnnouncementForm } from "~/modules/announcements/components/announcement-form";
import { getAnnouncementByIdClient, updateAnnouncementClient } from "~/modules/announcements/data/announcements-repo.client";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import type { Announcement } from "~/modules/announcements/model/announcement-types";

type LoaderData = {
  announcement: Announcement | null;
};

async function clientLoader({ params }: { params: { announcementId?: string } }): Promise<LoaderData> {
  const announcementId = params.announcementId;
  if (!announcementId) {
    return { announcement: null };
  }

  const { announcement } = await getAnnouncementByIdClient(announcementId);
  return { announcement };
}

clientLoader.hydrate = true as const;
export { clientLoader };

export default function DashboardAnnouncementEditPage() {
  const { announcement } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const dashboardData = useDashboardContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!announcement || !ready) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-sm text-muted-foreground">Announcement not found.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (payload: { title: string; description: string; imageUrls: string[] }) => {
    const { error } = await updateAnnouncementClient(announcement.id, payload);
    if (error) {
      toast.error(error.message || "Failed to update announcement");
      return;
    }

    toast.success("Announcement updated");
    navigate(`/dashboard/${dashboardData.community.slug}/announcements`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Announcement</h1>
          <p className="text-sm text-muted-foreground">Update title, description, and images.</p>
        </div>
        <AnnouncementForm
          initialTitle={announcement.title}
          initialDescription={announcement.description}
          initialImageUrls={(announcement.images || []).map((image) => image.image_url)}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
