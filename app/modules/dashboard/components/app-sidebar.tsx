import * as React from "react"

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/shared/components/ui/sidebar"
import { Home, Calendar, Settings, HelpCircle, Heart, LucideLayoutDashboard, Info, SquarePen, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar"
import type { Community, Profile } from "~/shared/models/entity.types"

import { Link } from "react-router"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  community?: Community
  user?: Profile
  userEmail?: string
  role?: 'owner' | 'admin'
}

export function AppSidebar({ community, user, userEmail, role, ...props }: AppSidebarProps) {
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
      end: true,
    },
    {
      title: "Events",
      url: `/dashboard/${communitySlug}/events`,
      icon: Calendar,
    },
    {
      title: "Forms",
      url: `/dashboard/${communitySlug}/forms`,
      icon: FileText,
    },
    {
      title: "Community Profile",
      url: `/dashboard/${communitySlug}/profile`,
      icon: SquarePen,
    },
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
