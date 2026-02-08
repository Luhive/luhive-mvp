import { Outlet, useLocation } from "react-router"
import { useEffect } from "react"
import type { Database } from "~/models/database.types"
import { setUser, setCommunityContext } from "~/services/sentry"
import { useDashboardCommunity } from "~/hooks/use-dashboard-community"
import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"
import Footer from "~/components/common/Footer"
import { DashboardLayoutSkeleton } from "~/components/dashboard/dashboard-layout-skeleton"

type Community = Database['public']['Tables']['communities']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

// Keep type for backward compatibility with components that reference it
export type DashboardLoaderData = {
  community: Community
  user: Profile
  userEmail: string
  role: 'owner' | 'admin'
}

// Helper to get dynamic header title based on current path
function getHeaderTitle(pathname: string): string {
  if (pathname.includes('/profile')) return 'Edit Community Profile'
  if (pathname.includes('/events')) return 'Events Management'
  if (pathname.includes('/forms')) return 'Google Forms'
  if (pathname.includes('/settings')) return 'Settings'
  return 'Dashboard Overview'
}

export default function DashboardLayout() {
  const location = useLocation()
  const { data, loading, error } = useDashboardCommunity()

  // Set Sentry user and community context
  useEffect(() => {
    if (data) {
      setUser({
        id: data.user.id,
        email: data.userEmail,
        username: data.user.full_name || undefined,
      });
      setCommunityContext({
        id: data.community.id,
        slug: data.community.slug,
        name: data.community.name,
      });
    }
  }, [data]);

  // Show loading skeleton while fetching
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // Show error state (redirects are handled in hook)
  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  const { community, user, userEmail, role } = data;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        variant="inset" 
        community={community}
        user={user}
        userEmail={userEmail}
        role={role}
        currentPath={location.pathname}
      />
      <SidebarInset>
        <SiteHeader title={getHeaderTitle(location.pathname)} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

