export { loader } from "~/modules/hub/server/hub-loader.server";
export { meta } from "~/modules/hub/model/hub-meta";

import { useLoaderData, Await, useNavigation } from "react-router";
import { Suspense } from "react";
import { HubPageSkeleton } from "~/modules/hub/components/hub-page-skeleton";
import { Spinner } from "~/shared/components/ui/spinner";
import type { HubLoaderData } from "~/modules/hub/model/hub-types";
import { CommunityGrid } from "~/modules/hub/components/community-grid";
import { HubEmptyState } from "~/modules/hub/components/hub-empty-state";
import { HubHeader } from "~/modules/hub/components/hub-header";

export default function HubPage() {
  const { data } = useLoaderData<HubLoaderData>();
  const navigation = useNavigation();
  const isCommunityTransitionLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname.startsWith("/c/");

  return (
    <>
      {isCommunityTransitionLoading && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Going to Community...
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={<HubPageSkeleton user={null} />}>
        <Await resolve={data}>
          {(resolvedData) => (
            <main className="py-8">
              <HubHeader />
              {resolvedData.communities.length === 0 ? (
                <HubEmptyState />
              ) : (
                <CommunityGrid communities={resolvedData.communities} />
              )}
            </main>
          )}
        </Await>
      </Suspense>
    </>
  );
}
