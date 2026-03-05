import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { Badge } from "~/shared/components/ui/badge";
import type { Announcement } from "~/modules/announcements/model/announcement-types";

type AnnouncementListProps = {
  announcements: Announcement[];
  communitySlug: string;
};

export function AnnouncementList({ announcements, communitySlug }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No announcements yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              <Badge variant={announcement.published ? "default" : "secondary"}>
                {announcement.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(announcement.created_at).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.description}</p>
            {announcement.images && announcement.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {announcement.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={announcement.title}
                    className="h-28 w-full rounded-md object-cover border"
                  />
                ))}
              </div>
            )}
            <div>
              <Link
                to={`/dashboard/${communitySlug}/announcements/${announcement.id}/edit`}
                className="text-sm underline text-primary"
              >
                Edit announcement
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
