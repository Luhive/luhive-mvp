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
import {
  Home,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Heart,
  LucideLayoutDashboard,
  Info,
  SquarePen,
  FileText,
  Megaphone,
  ExternalLink,
  Copy,
  Check,
  LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar"
import type { Community, Profile } from "~/shared/models/entity.types"

import { Link } from "react-router"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  community?: Community
  user?: Profile
  userEmail?: string
  role?: 'owner' | 'admin'
  collabRequestCount?: number
}

export function AppSidebar({ community, user, userEmail, role, collabRequestCount = 0, ...props }: AppSidebarProps) {
  const [copied, setCopied] = React.useState(false);

  // Use community data if available, otherwise use defaults
  const communityName = community?.name || "Community"
  const communityLogo = community?.logo_url
  const communitySlug = community?.slug || "/"

  function handleCopy() {
    const url = `${window.location.origin}/c/${communitySlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      title: "Collab Requests",
      url: `/dashboard/${communitySlug}/collab-requests`,
      icon: Bell,
      badge: collabRequestCount,
    },
    // {
    //   title: "Forms",
    //   url: `/dashboard/${communitySlug}/forms`,
    //   icon: FileText,
    // },
    {
      title: "Announcements",
      url: `/dashboard/${communitySlug}/announcements`,
      icon: Megaphone,
    },
    {
      title: "Community Profile",
      url: `/dashboard/${communitySlug}/profile`,
      icon: SquarePen,
    },
  ];

  const navSecondary: { title: string; url: string; icon: LucideIcon }[] = [
    // {
    //   title: "Settings",
    //   url: `/dashboard/${communitySlug}/settings`,
    //   icon: Settings,
    // },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: HelpCircle,
    // },
  ];

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
              className="data-[slot=sidebar-menu-button]:!p-0"
            >
              <Link to={`/c/${communitySlug}`} className="min-w-0">
                <Avatar className="!size-7 shrink-0">
                  <AvatarImage src={communityLogo || ""} alt={communityName} />
                  <AvatarFallback className="text-sm font-semibold">
                    {communityName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 truncate text-lg font-medium tracking-tight">
                  {communityName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <SidebarMenu className="px-2 mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href={`/c/${communitySlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View public page</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleCopy}
              className={
                copied
                  ? "text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors duration-300"
                  : "transition-colors duration-300"
              }
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? "Copied!" : "Copy public page link"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavSecondary items={navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
