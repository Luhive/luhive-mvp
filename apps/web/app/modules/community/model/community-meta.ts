import type { Community } from "~/modules/community/model/community-types";

export function meta({ data }: { data?: { community?: Community | null } }) {
  const community = data?.community;
  return [
    {
      title: community
        ? `${community.name} - Luhive`
        : "Community Page - Luhive",
    },
    {
      name: "description",
      content: community?.description || "Build Communities that Matter",
    },
  ];
}
