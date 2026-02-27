import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Spinner } from "~/shared/components/ui/spinner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/shared/components/ui/avatar";
import { createClient } from "~/shared/lib/supabase/client";
import { toast } from "sonner";
import type { Community } from "~/shared/models/entity.types";

interface CollaborationInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  hostCommunityId: string;
  communitySlug: string;
  excludedIds?: string[];
  collectOnly?: boolean;
  onCollect?: (community: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  }) => void;
  onSuccess?: () => void;
}

export function CollaborationInviteDialog({
  open,
  onOpenChange,
  eventId,
  hostCommunityId,
  communitySlug,
  excludedIds,
  collectOnly,
  onCollect,
  onSuccess,
}: CollaborationInviteDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  const fetcher = useFetcher();
  const hasProcessedSuccessRef = useRef(false);

  /* =========================
     SEARCH EFFECT
  ========================= */
  useEffect(() => {
    if (!open) return;

    if (searchQuery.length < 2) {
      setCommunities([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("communities")
        .select("id, name, slug, logo_url")
        .eq("is_show", true)
        .neq("id", hostCommunityId)
        .ilike("name", `%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error(error);
        toast.error("Failed to search communities");
      } else {
        let results: Community[] = data || [];

        if (excludedIds?.length) {
          results = results.filter((c) => !excludedIds.includes(c.id));
        }

        setCommunities(results);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open, hostCommunityId, excludedIds]);

  /* =========================
     TOGGLE SELECT
  ========================= */
  const toggleCommunity = (community: Community) => {
    setSelectedCommunities((prev) => {
      const exists = prev.find((c) => c.id === community.id);
      if (exists) {
        return prev.filter((c) => c.id !== community.id);
      }
      return [...prev, community];
    });
  };

  /* =========================
     HANDLE INVITE
  ========================= */
  const handleInvite = () => {
    if (selectedCommunities.length === 0) {
      toast.error("Please select at least one community");
      return;
    }

    // Collect only mode
    if (collectOnly && onCollect) {
      selectedCommunities.forEach((community) => {
        onCollect({
          id: community.id,
          name: community.name,
          slug: community.slug,
          logo_url: community.logo_url,
        });
      });

      toast.success(
        `Added ${selectedCommunities.length} community(ies) to pending invites`
      );

      onOpenChange(false);
      resetState();
      return;
    }

    if (!eventId) {
      toast.error("Event ID is missing");
      return;
    }

    if (selectedCommunities.length > 1) {
      toast.error("Please select only one community");
      return;
    }

    const selected = selectedCommunities[0];

    hasProcessedSuccessRef.current = false;

    const formData = new FormData();
    formData.append("intent", "invite-collaboration");
    formData.append("coHostCommunityId", selected.id);

    fetcher.submit(formData, {
      method: "POST",
      action: `/c/${communitySlug}/events/${eventId}/collaboration`,
    });
  };

  /* =========================
     HANDLE RESPONSE
  ========================= */
  useEffect(() => {
    if (!open) {
      hasProcessedSuccessRef.current = false;
      resetState();
      return;
    }

    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      "success" in fetcher.data &&
      !hasProcessedSuccessRef.current
    ) {
      hasProcessedSuccessRef.current = true;

      if (fetcher.data.success) {
        toast.success("Collaboration invitation sent!");
        onOpenChange(false);
        onSuccess?.();
        resetState();
      } else {
        toast.error(fetcher.data.error || "Failed to send invitation");
      }
    }
  }, [open, fetcher.state, fetcher.data]);

  const resetState = () => {
    setSearchQuery("");
    setSelectedCommunities([]);
    setCommunities([]);
  };

  /* =========================
     UI
  ========================= */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Community to Collaborate</DialogTitle>
          <DialogDescription>
            Search for a community to invite as a co-host for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Communities</Label>
            <Input
              id="search"
              placeholder="Type community name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {/* Results */}
          {!loading && searchQuery.length >= 2 && communities.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
              {communities.map((community) => {
                const isSelected = selectedCommunities.some(
                  (c) => c.id === community.id
                );

                return (
                  <button
                    key={community.id}
                    type="button"
                    onClick={() => toggleCommunity(community)}
                    className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                      isSelected
                        ? "bg-muted border border-blue-500"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={community.logo_url || undefined}
                        alt={community.name}
                      />
                      <AvatarFallback>
                        {community.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{community.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty */}
          {!loading && searchQuery.length >= 2 && communities.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No communities found
            </div>
          )}

          {/* Selected */}
          {selectedCommunities.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">
                Selected ({selectedCommunities.length}):
              </span>

              {selectedCommunities.map((community) => (
                <div
                  key={community.id}
                  className="p-2 bg-muted rounded-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={community.logo_url || undefined}
                        alt={community.name}
                      />
                      <AvatarFallback>
                        {community.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{community.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCommunity(community)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <Button
              onClick={handleInvite}
              disabled={
                selectedCommunities.length === 0 ||
                (!collectOnly && fetcher.state === "submitting")
              }
            >
              {collectOnly
                ? "OK"
                : fetcher.state === "submitting"
                ? "Sending..."
                : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}