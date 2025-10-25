import { redirect } from "react-router"
import { Outlet, useLoaderData, useLocation } from "react-router"
import { createClient } from "~/lib/supabase.server"
import type { Database } from "~/models/database.types"

import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"

type Community = Database['public']['Tables']['communities']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type DashboardLoaderData = {
  community: Community
  user: Profile
  userEmail: string
  role: 'owner' | 'admin'
}

export async function loader({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const { supabase, headers } = createClient(request)

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return redirect('/login', { headers })
  }

  // Get slug from params
  const slug = (params as { slug?: string }).slug

  if (!slug) {
    return redirect('/', { headers })
  }

  // Fetch community data
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (communityError || !community) {
    return redirect(`/c/${slug}`, { headers })
  }

  // Check if user is owner or admin
  const isOwner = community.created_by === user.id
  let role: 'owner' | 'admin' | null = null

  if (isOwner) {
    role = 'owner'
  } else {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()

    if (membership && membership.role === 'admin') {
      role = 'admin'
    }
  }

  // If not owner or admin, redirect
  if (!role) {
    return redirect(`/c/${slug}`, { headers })
  }

  // Get user email from auth
  const userEmail = user.email || 'user@example.com'

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    const defaultProfile: Profile = {
      id: user.id,
      full_name: user.email?.split('@')[0] || 'User',
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: null,
      gamification: null,
    }
    
    return {
      community,
      user: defaultProfile,
      userEmail,
      role,
    }
  }

  return {
    community,
    user: profile,
    userEmail,
    role,
  }
}

// Helper to get dynamic header title based on current path
function getHeaderTitle(pathname: string): string {
  if (pathname.includes('/profile')) return 'Edit Community Profile'
  if (pathname.includes('/events')) return 'Events Management'
  if (pathname.includes('/settings')) return 'Settings'
  return 'Dashboard Overview'
}

export default function DashboardLayout() {
  const { community, user, userEmail, role } = useLoaderData<DashboardLoaderData>()
  const location = useLocation()

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
      </SidebarInset>
    </SidebarProvider>
  )
}

