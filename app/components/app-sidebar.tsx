import * as React from "react"

import { NavDocuments } from "~/components/nav-documents"
import { NavMain } from "~/components/nav-main"
import { NavSecondary } from "~/components/nav-secondary"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { Home, Calendar, Settings, HelpCircle, Heart, LucideLayoutDashboard, Info, SquarePen, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import type { Database } from "~/models/database.types"

import { Link } from "react-router"

type Community = Database['public']['Tables']['communities']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  community?: Community
  user?: Profile
  userEmail?: string
  role?: 'owner' | 'admin'
  currentPath?: string
}

export function AppSidebar({ community, user, userEmail, role, currentPath, ...props }: AppSidebarProps) {
  // Use community data if available, otherwise use defaults
  const communityName = community?.name || "Community"
  const communityLogo = community?.logo_url
  const communitySlug = community?.slug || "/"

  // Use user data if available, otherwise use defaults
  const userName = user?.full_name || "User"
  const userAvatar = user?.avatar_url || null
  const email = userEmail || "user@example.com"

  const navMain = [
    {
      title: "Home",
      url: `/dashboard/${communitySlug}`,
      icon: Home,
      isActive: currentPath === `/dashboard/${communitySlug}`,
    },
    {
      title: "Events",
      url: `/dashboard/${communitySlug}/events`,
      icon: Calendar,
      isActive: currentPath?.includes('/events') || false,
    },
    {
      title: "Forms",
      url: `/dashboard/${communitySlug}/forms`,
      icon: FileText,
      isActive: currentPath?.includes('/forms') || false,
    },
    {
      title: "Community Profile",
      url: `/dashboard/${communitySlug}/profile`,
      icon: SquarePen,
      isActive: currentPath?.includes('/profile') || false,
    }
  ]

  const navSecondary = [
    {
      title: "Settings",
      url: `/dashboard/${communitySlug}/settings`,
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircle,
    },
  ]

  const userData = {
    name: userName,
    email: email,
    avatar: userAvatar || "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-6"
            >
              <Link to={`/c/${communitySlug}`}>
                <Avatar className="!size-9">
                  <AvatarImage 
                    src={communityLogo || ''} 
                    alt={communityName}  
                  />
                  <AvatarFallback className="font-black">
                    {communityName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xl font-semibold tracking-tight">{communityName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
