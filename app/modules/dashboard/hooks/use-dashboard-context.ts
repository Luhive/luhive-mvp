import { useOutletContext } from "react-router";
import type { DashboardCommunityData } from "~/modules/dashboard/model/dashboard-types";

export type DashboardOutletContext = {
  dashboardData: DashboardCommunityData;
};

/**
 * Returns the dashboard bootstrap data provided by the dashboard layout.
 * Use this instead of useDashboardCommunity() in dashboard child routes/components.
 */
export function useDashboardContext(): DashboardCommunityData {
  const context = useOutletContext<DashboardOutletContext>();
  if (!context?.dashboardData) {
    throw new Error(
      "useDashboardContext must be used within a dashboard layout (Outlet context with dashboardData)"
    );
  }
  return context.dashboardData;
}
