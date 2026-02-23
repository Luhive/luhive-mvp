import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Badge } from "~/shared/components/ui/badge";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent } from "~/shared/components/ui/card";
import { Separator } from "~/shared/components/ui/separator";
import { Trash2 } from "lucide-react";
import { CollaborationBadge } from "./collaboration-badge";

export type CollaborationWithCommunity = {
  id: string;
  role: "host" | "co-host";
  status: "pending" | "accepted" | "rejected";
  invited_at: string;
  accepted_at: string | null;
  community: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
};

interface CollaborationListProps {
  collaborations: CollaborationWithCommunity[];
  isHost: boolean;
  onRemove?: (collaborationId: string) => void;
}

export function CollaborationList({
  collaborations,
  isHost,
  onRemove,
}: CollaborationListProps) {
  if (collaborations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No collaborations yet. Invite communities to collaborate on this event.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collaborations.map((collab) => (
        <Card key={collab.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={collab.community.logo_url || undefined}
                    alt={collab.community.name}
                  />
                  <AvatarFallback>
                    {collab.community.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{collab.community.name}</span>
                    <CollaborationBadge role={collab.role} />
                    {collab.status === "pending" && (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {collab.status === "accepted"
                      ? `Accepted on ${new Date(collab.accepted_at!).toLocaleDateString()}`
                      : `Invited on ${new Date(collab.invited_at).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
              {isHost &&
                collab.role === "co-host" &&
                onRemove &&
                collab.status === "accepted" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(collab.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
