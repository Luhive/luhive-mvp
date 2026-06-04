import { useCallback, useEffect, useRef } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";

type UpdateMemberRoleResponse = {
  success: boolean;
  error?: string;
  role?: "admin" | "member";
};

export function useMemberRoleActions(communityId: string) {
  const fetcher = useFetcher<UpdateMemberRoleResponse>();
  const revalidator = useRevalidator();
  const lastIntentRef = useRef<"promote" | "demote" | null>(null);

  const pendingMemberId =
    fetcher.state !== "idle"
      ? (fetcher.formData?.get("memberId") as string | null)
      : null;

  const submitRoleChange = useCallback(
    (memberId: string, intent: "promote" | "demote") => {
      lastIntentRef.current = intent;
      fetcher.submit(
        { memberId, communityId, intent },
        { method: "post", action: "/api/community/update-member-role" },
      );
    },
    [communityId, fetcher],
  );

  const promoteMember = useCallback(
    (memberId: string) => submitRoleChange(memberId, "promote"),
    [submitRoleChange],
  );

  const demoteMember = useCallback(
    (memberId: string) => submitRoleChange(memberId, "demote"),
    [submitRoleChange],
  );

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const intent = lastIntentRef.current;
    if (!intent) return;

    if (fetcher.data.success) {
      revalidator.revalidate();
      toast.success(
        intent === "promote"
          ? "Member promoted to admin"
          : "Admin demoted to member",
      );
    } else {
      toast.error(fetcher.data.error ?? "Failed to update member role");
    }

    lastIntentRef.current = null;
  }, [fetcher.state, fetcher.data, revalidator]);

  return {
    promoteMember,
    demoteMember,
    updatingMemberId: pendingMemberId,
  };
}
