import { useLoaderData, Await } from "react-router";
import { Suspense } from "react";
import { HubPageSkeleton } from "~/components/hub-page-skeleton";
import type { HubLoaderData } from "~/modules/hub/model/hub-types";
import { CommunityGrid } from "./components/community-grid";
import { HubEmptyState } from "./components/hub-empty-state";
import { HubHeader } from "./components/hub-header";

export default function HubPage() {
  const { data } = useLoaderData<HubLoaderData>();

  return (
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
  );
}
