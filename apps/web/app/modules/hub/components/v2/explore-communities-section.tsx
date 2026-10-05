import type { Community } from "~/modules/hub/model/hub-types";
import { ExploreCommunityCard } from "~/modules/hub/components/v2/explore-community-card";
import { HubEmptyMessage } from "~/modules/hub/components/v2/hub-empty-message";
import {
  communityGridClassName,
  sectionClassName,
} from "~/modules/hub/components/v2/hub-grid-layout";
import { HubSectionHeader } from "~/modules/hub/components/v2/hub-section-header";
import { useSectionExpansion } from "~/modules/hub/hooks/use-section-expansion";
import { getRiseDelayMs } from "~/modules/hub/utils/get-rise-delay-ms";
import { matchesSearchQuery } from "~/modules/hub/utils/matches-search-query";

const PREVIEW_COUNT = 6;
const HEADING_ID = "explore-communities-heading";
const GRID_ID = "explore-communities-grid";

type ExploreCommunitiesSectionProps = {
  communities: Community[];
  normalizedQuery: string;
};

export function ExploreCommunitiesSection({
  communities,
  normalizedQuery,
}: ExploreCommunitiesSectionProps) {
  const { sectionRef, isExpanded, toggle } = useSectionExpansion<HTMLElement>();
  const isSearching = normalizedQuery.length > 0;

  const matches = communities.filter((community) =>
    matchesSearchQuery(normalizedQuery, [community.name, community.tagline, community.description]),
  );
  const isShowingAll = isExpanded || isSearching;
  const visible = isShowingAll ? matches : matches.slice(0, PREVIEW_COUNT);
  const canToggle = !isSearching && communities.length > PREVIEW_COUNT;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={HEADING_ID}
      className={sectionClassName}
    >
      <HubSectionHeader
        id={HEADING_ID}
        title="Explore Communities"
        isExpanded={isExpanded}
        onToggle={canToggle ? toggle : undefined}
        controlsId={GRID_ID}
      />

      {visible.length === 0 ? (
        <HubEmptyMessage>
          {isSearching
            ? "No communities match your search."
            : "No communities yet. Check back soon."}
        </HubEmptyMessage>
      ) : (
        <div id={GRID_ID} className={communityGridClassName}>
          {visible.map((community, index) => (
            <ExploreCommunityCard
              key={community.id}
              community={community}
              riseDelayMs={getRiseDelayMs(index < PREVIEW_COUNT ? index : index - PREVIEW_COUNT)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
