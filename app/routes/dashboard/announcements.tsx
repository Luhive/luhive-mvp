import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/shared/components/ui/button";
import { AnnouncementList } from "~/modules/announcements/components/announcement-list";
import { getDashboardAnnouncementsClient } from "~/modules/announcements/data/announcements-repo.client";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import type { Announcement } from "~/modules/announcements/model/announcement-types";
import { toast } from "sonner";
import { useSidebar } from "~/shared/components/ui/sidebar";

export default function DashboardAnnouncementsPage() {
  const dashboardData = useDashboardContext();
  const navigate = useNavigate();
  const { setOpen, setOpenMobile } = useSidebar();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  function handleCreate() {
    setOpen(false);
    setOpenMobile(false);
    navigate(`/dashboard/${dashboardData.community.slug}/announcements/new`);
  }

  useEffect(() => {
    async function loadAnnouncements() {
      const { announcements: data, error } = await getDashboardAnnouncementsClient(
        dashboardData.community.id
      );

      if (error) {
        toast.error("Failed to load announcements");
      }

      setAnnouncements(data || []);
      setLoading(false);
    }

    loadAnnouncements();
  }, [dashboardData.community.id]);

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Create updates and notify all community members.</p>
          </div>
          <Button onClick={handleCreate}>
            Create Announcement
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        ) : (
          <AnnouncementList announcements={announcements} communitySlug={dashboardData.community.slug} />
        )}
      </div>
    </div>
  );
}
