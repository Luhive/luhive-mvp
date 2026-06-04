import { Link } from "react-router";
import { Badge } from "~/shared/components/ui/badge";
import type {
  Announcement,
  AnnouncementImage,
} from "~/modules/announcements/model/announcement-types";

const imageBaseClass =
  "rounded-md border border-border object-contain bg-muted/30";

function AnnouncementListImages({ images }: { images: AnnouncementImage[] }) {
  if (images.length === 1) {
    return (
      <div className="pt-1">
        <img
          src={images[0].image_url}
          alt=""
          className={`max-h-56 w-full max-w-md ${imageBaseClass}`}
        />
      </div>
    );
  }

  const visible = images.slice(0, 4);
  const overflow = images.length - visible.length;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {visible.map((image) => (
        <img
          key={image.id}
          src={image.image_url}
          alt=""
          className={`max-h-40 max-w-[10rem] ${imageBaseClass}`}
        />
      ))}
      {overflow > 0 ? (
        <span className="flex max-h-40 min-w-[4rem] max-w-[10rem] items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

type AnnouncementListProps = {
  announcements: Announcement[];
  communitySlug: string;
};

export function AnnouncementList({ announcements, communitySlug }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <p className="border-b py-10 text-center text-sm text-muted-foreground">
        No announcements yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border border-t border-border">
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-medium leading-snug">{announcement.title}</h3>
              <Badge
                variant={announcement.published ? "secondary" : "outline"}
                className="h-5 px-1.5 text-[10px] font-normal"
              >
                {announcement.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <time
              dateTime={announcement.created_at}
              className="block text-xs text-muted-foreground"
            >
              {new Date(announcement.created_at).toLocaleString()}
            </time>
            {announcement.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {announcement.description}
              </p>
            ) : null}
            {announcement.images && announcement.images.length > 0 ? (
              <AnnouncementListImages images={announcement.images} />
            ) : null}
          </div>
          <Link
            to={`/dashboard/${communitySlug}/announcements/${announcement.id}/edit`}
            className="shrink-0 text-sm text-primary hover:underline"
          >
            Edit
          </Link>
        </article>
      ))}
    </div>
  );
}
