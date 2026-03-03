import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/shared/components/ui/button";
import { AnnouncementList } from "~/modules/announcements/components/announcement-list";
import { getDashboardAnnouncementsClient } from "~/modules/announcements/data/announcements-repo.client";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import type { Announcement } from "~/modules/announcements/model/announcement-types";
import { toast } from "sonner";

export default function DashboardAnnouncementsPage() {
  const dashboardData = useDashboardContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Create updates and notify all community members.</p>
          </div>
          <Button asChild>
            <Link to={`/dashboard/${dashboardData.community.slug}/announcements/create`}>
              Create Announcement
            </Link>
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
