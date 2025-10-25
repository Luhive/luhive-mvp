import type { Route } from "./+types/community";
import { useLoaderData, Link, useNavigation } from "react-router";
import { createClient } from "~/lib/supabase.server";
import type { Database } from "~/models/database.types";
import { useSubmit } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Spinner } from "~/components/ui/spinner"
import { toast } from "sonner"
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Send,
  MessageCircle,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  BadgeCheck,
  Heart,
  LogOut,
  Link as LinkIcon,
  Globe,

} from "lucide-react"

import LuhiveLogo from "~/assets/images/LuhiveLogo.png";
import { Activity } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "~/components/ui/tooltip";

type Community = Database['public']['Tables']['communities']['Row'];

type LoaderData = {
  community: Community | null;
  isOwner: boolean;
  user: { id: string } | null;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  // Get slug from params (it will be undefined on index route)
  const slug = (params as { slug?: string }).slug;

  // If no slug parameter, return default/demo data
  if (!slug) {
    return {
      community: null,
      isOwner: false,
      user: user || null,
    };
  }
  // Fetch community by slug
  const { data: community, error } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !community) {
    throw new Response('Community not found', { status: 404 });
  }

  // Check if user is the owner
  const isOwner = user ? community.created_by === user.id : false;

  return {
    community,
    isOwner,
    user: user || null,
  };
}

export function meta({ data }: { data?: LoaderData }) {
  const community = data?.community;
  return [
    { title: community ? `${community.name} - Luhive` : "Community Page - Luhive" },
    { name: "description", content: community?.description || "Build Communities that Matter" },
  ];
}

export default function Community() {
  const { community, isOwner, user } = useLoaderData<typeof loader>();

  const submit = useSubmit()
  const navigation = useNavigation()

  // Check if logout is in progress
  const isLoggingOut = navigation.state === "submitting" &&
    navigation.formAction === "/logout"

  // Check if navigating to dashboard - for global loading state
  const isDashboardLoading = navigation.state === "loading" &&
    navigation.location?.pathname.includes('/dashboard/')

  // Use community data if available, otherwise use default demo data
  const displayName = community?.name || "You Community Name";
  const displayTagline = community?.tagline || "Community Tagline";
  const displayDescription = community?.description || "Community Description";
  const displayLogo = community?.logo_url || '';
  const displayVerified = community?.verified || false;

  // Parse stats if available
  const stats = community?.stats as { members?: number; events?: number } | null;
  const memberCount = stats?.members || 0;
  const eventCount = stats?.events || 0;

  // Parse social links if available
  const socialLinks = community?.social_links as {
    website?: string;
    instagram?: string;
    linkedin?: string;
  } | null;


  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Loading Overlay for Dashboard Navigation */}
      {isDashboardLoading && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading Dashboard...</p>
          </div>
        </div>
      )}

      <Activity mode={isOwner ? "visible" : "hidden"}>
        <div className="fixed top-4 right-4 z-50">
          <div className="flex flex-col gap-2">
            <TooltipProvider delayDuration={200}>
              {/* Dashboard Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="group h-10 w-10 rounded-md shadow-sm hover:shadow-md transition-all duration-200 bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    aria-label="Community Dashboard"
                    asChild
                  >
                    <Link to={`/dashboard/${community?.slug || 'luhive'}`} prefetch="intent">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-popover rounded-md border border-border mr-1 shadow-lg">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Dashboard</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>


              {/* Get Public URL Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="group h-10 w-10 rounded-md shadow-sm hover:shadow-md transition-all duration-200 bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    aria-label="Get Public URL"
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard.writeText(url);
                      toast.success("Public URL copied to clipboard!");
                    }}
                  >
                    <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-popover rounded-md border border-border mr-1 shadow-lg">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Get Public URL</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Logout Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="group h-10 w-10 rounded-md shadow-sm hover:shadow-md transition-all duration-200 bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isLoggingOut ? "Signing out..." : "Logout"}
                    disabled={isLoggingOut}
                    onClick={() => {
                      submit(null, {
                        method: "post",
                        action: "/logout"
                      })
                    }}
                  >
                    {isLoggingOut ? (
                      <Spinner className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-popover rounded-md border border-border mr-1 shadow-lg">
                  <div className="flex items-center gap-2 px-3 py-2">
                    {isLoggingOut ? (
                      <Spinner className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {isLoggingOut ? "Signing out..." : "Logout"}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>
        </div>
      </Activity>
      {/* Owner Dashboard Icon */}

      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {/* Profile Card - Large */}
            <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4">
                <Avatar className="h-24 w-24 border-1">
                  <AvatarImage src={displayLogo} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight">{displayName}</h1>
                  <p className="text-lg text-primary font-medium">{displayTagline}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    {displayDescription}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-primary/30 text-primary px-3 py-1.5"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    First Adopter
                  </Badge>
                  {displayVerified && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified by Luhive
                    </Badge>
                  )}
                </div>
                <div className="flex justify-center gap-2 flex-wrap pt-2">
                  <Activity mode={socialLinks?.website ? "visible" : "hidden"}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      aria-label="Website"
                      onClick={() => window.open(socialLinks?.website, '_blank', 'noopener,noreferrer')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </Activity>

                  <Activity mode={socialLinks?.instagram ? "visible" : "hidden"}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      aria-label="Instagram"
                      onClick={() => window.open(socialLinks?.instagram, '_blank', 'noopener,noreferrer')}
                    >
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </Activity>

                  <Activity mode={socialLinks?.linkedin ? "visible" : "hidden"}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      aria-label="LinkedIn"
                      onClick={() => window.open(socialLinks?.linkedin, '_blank', 'noopener,noreferrer')}
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </Activity>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card 1 */}
            <Card className="border hover:border-primary/30 transition-colors shadow-none">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                <Users className="h-10 w-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">{memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}K+` : memberCount}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </CardContent>
            </Card>

            {/* Stats Card 2 */}
            <Card className="border hover:border-primary/30 shadow-none">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                <Calendar className="h-10 w-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">{eventCount}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Join Our Community</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">View Upcoming Events</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Read Latest Posts</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Access Dashboard</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-muted border-solid border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Android Development Workshop</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 15, 2025 • 6:00 PM</p>
                      </div>
                      <Badge variant="outline" className="text-secondary-foreground border-border">
                        Workshop
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Cloud Architecture Talk</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 22, 2025 • 7:00 PM</p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground">
                        Talk
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Community Networking Night</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 29, 2025 • 6:30 PM</p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground">
                        Social
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts Card */}
            <Card className="md:col-span-2 lg:col-span-4 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <BookOpen className="h-5 w-5" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Getting Started with Flutter</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Learn the basics of Flutter development and build your first mobile app...
                    </p>
                    <p className="text-xs text-muted-foreground/70">2 days ago</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Firebase Best Practices</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Discover tips and tricks for optimizing your Firebase implementation...
                    </p>
                    <p className="text-xs text-muted-foreground/70">5 days ago</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Community Highlights 2024</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      A look back at our amazing year of events, workshops, and growth...
                    </p>
                    <p className="text-xs text-muted-foreground/70">1 week ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="md:col-span-2 lg:col-span-4 text-center py-4">
              <p className="text-sm text-muted-foreground">Powered by Luhive © 2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
