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
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { createClient } from "~/shared/lib/supabase/client";
import { toast } from "sonner";
import type { Community } from "~/shared/models/entity.types";

interface CollaborationInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // when used in create mode the eventId may not be available
  eventId?: string;
  hostCommunityId: string;
  communitySlug: string;
  // communities that should be excluded from search results (already selected/pending)
  excludedIds?: string[];
  // when true, the dialog will only return the selected community via `onCollect`
  collectOnly?: boolean;
  onCollect?: (community: { id: string; name: string; slug: string; logo_url?: string | null }) => void;
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
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher();
  const hasProcessedSuccessRef = useRef(false);

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("communities")
          .select("id, name, slug, logo_url")
          .eq("is_show", true)
          .neq("id", hostCommunityId) // Exclude host community
          .ilike("name", `%${searchQuery}%`)
          .limit(10);

        if (error) {
          console.error("Error searching communities:", error);
          toast.error("Failed to search communities");
        } else {
          let results: Community[] = data || [];
          // hide any communities we've been asked to exclude
          if (excludedIds && excludedIds.length > 0) {
            results = results.filter((c) => !excludedIds.includes(c.id));
          }
          // if user already selected one, don't remove it from results yet (it should
          // still be clickable/highlighted) but we also don't want duplicates, so
          // optionally filter it out too
          if (selectedCommunityId) {
            results = results.filter((c) => c.id !== selectedCommunityId);
          }
          setCommunities(results);
        }
        setLoading(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (open && searchQuery.length === 0) {
      setCommunities([]);
    }
  }, [searchQuery, open, hostCommunityId, excludedIds]);

  const handleInvite = () => {
    if (!selectedCommunityId) {
      toast.error("Please select a community");
      return;
    }

    // prefer the cached object; if somehow missing, fall back to lookup
    const communityObj = selectedCommunity || communities.find((c) => c.id === selectedCommunityId);
    if (!communityObj) {
      toast.error("Selected community not found");
      return;
    }

    // If collectOnly, return selected community to caller and don't submit
    if (collectOnly && onCollect) {
      onCollect({
        id: selectedCommunity.id,
        name: selectedCommunity.name,
        slug: selectedCommunity.slug,
        logo_url: selectedCommunity.logo_url,
      });
      toast.success('Community added to pending invites');
      // reset and close
      setTimeout(() => {
        onOpenChange(false);
        setSearchQuery("");
        setSelectedCommunityId("");
        setCommunities([]);
      }, 100);
      return;
    }

    // Reset processed flag when submitting new invitation
    hasProcessedSuccessRef.current = false;

    const formData = new FormData();
    formData.append("intent", "invite-collaboration");
    formData.append("coHostCommunityId", selectedCommunityId);

    fetcher.submit(formData, {
      method: "POST",
      action: `/c/${communitySlug}/events/${eventId}/collaboration`,
    });
  };

  useEffect(() => {
    // Only process when dialog is open, fetcher is idle (finished), and we have data
    if (open && fetcher.state === "idle" && fetcher.data && "success" in fetcher.data) {
      // Only process success once
      if (fetcher.data.success && !hasProcessedSuccessRef.current) {
        hasProcessedSuccessRef.current = true;
        toast.success("Collaboration invitation sent!");
        // Close dialog first to prevent re-renders
        onOpenChange(false);
        // Then call onSuccess and reset state
        setTimeout(() => {
          onSuccess?.();
          setSearchQuery("");
          setSelectedCommunityId("");
          setSelectedCommunity(null);
          setCommunities([]);
        }, 100);
      } else if (!fetcher.data.success && !hasProcessedSuccessRef.current) {
        // Always show errors (but only once)
        hasProcessedSuccessRef.current = true;
        toast.error(fetcher.data.error || "Failed to send invitation");
      }
    }
    
    // Reset processed flag when dialog closes
    if (!open) {
      hasProcessedSuccessRef.current = false;
      // clear any transient selection/search state so the dialog is fresh next time
      setSearchQuery("");
      setSelectedCommunityId("");
      setSelectedCommunity(null);
      setCommunities([]);
    }
  }, [open, fetcher.state, fetcher.data, onOpenChange, onSuccess]);

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
          <div className="space-y-2">
            <Label htmlFor="search">Search Communities</Label>
            <Input
              id="search"
              placeholder="Type community name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {!loading && searchQuery.length >= 2 && communities.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
              {communities.map((community) => (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommunityId(community.id);
                    setSelectedCommunity(community);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors ${
                    selectedCommunityId === community.id ? "bg-muted" : ""
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
              ))}
            </div>
          )}

          {!loading && searchQuery.length >= 2 && communities.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No communities found
            </div>
          )}

          {selectedCommunity && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected:</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={selectedCommunity.logo_url || undefined}
                    alt={selectedCommunity.name}
                  />
                  <AvatarFallback>
                    {selectedCommunity.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{selectedCommunity.name}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!selectedCommunityId || (!collectOnly && fetcher.state === "submitting")}
            >
              {collectOnly ? (
                'OK'
              ) : fetcher.state === "submitting" ? (
                <>
                  <Spinner className="mr-2" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
