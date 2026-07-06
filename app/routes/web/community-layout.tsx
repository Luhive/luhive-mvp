export { loader } from "~/modules/community/server/community-layout-loader.server";
export { action } from "~/modules/community/server/community-action.server";
export { meta } from "~/modules/community/model/community-meta";

export function shouldRevalidate({
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: {
  nextUrl: URL;
  formMethod?: string;
  defaultShouldRevalidate: boolean;
}) {
  if (nextUrl.searchParams.has("published")) return true;
  if (formMethod === "GET" || formMethod === undefined) return false;
  return defaultShouldRevalidate;
}

import { Outlet } from "react-router";

export default function CommunityLayout() {
  return <Outlet />;
}
