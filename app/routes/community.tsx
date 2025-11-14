import type { Route } from "./+types/community";
import { useLoaderData, Link, useNavigation, useActionData, useRevalidator } from "react-router";
import { createClient } from "~/lib/supabase.server";
import type { Database } from "~/models/database.types";
import { useSubmit } from 'react-router';
import { useEffect, useState, Suspense, lazy } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Spinner } from "~/components/ui/spinner"
import { toast } from "sonner"
import {
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
  Link as LinkIcon,
  Globe,
  Link2,
  Megaphone,
  Hourglass,
  UserCheck,
} from "lucide-react"

import { Activity } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";
import { getUserAgent } from "~/lib/userAgent";
import { getIpLocation } from "~/lib/getIpLocation";
import { prepareVisitAnalytics, type VisitAnalytics } from "~/lib/visitTracker";
import { getSessionId, shouldTrackVisit, isFirstVisit } from "~/lib/sessionTracker";
import { JoinCommunityForm } from "~/components/join-community-form";
import { CoverPictureUpload } from "~/components/cover-picture-upload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { EventListSkeleton } from "~/components/events/event-list";
import { useIsMobile } from "~/hooks/use-mobile";

// Lazy load EventList component
const EventList = lazy(() => import("~/components/events/event-list").then(module => ({ default: module.EventList })));

type Community = Database['public']['Tables']['communities']['Row'];

type LoaderData = {
  community: Community | null;
  isOwner: boolean;
  isMember: boolean;
  user: { id: string } | null;
  analytics: VisitAnalytics;
  memberCount: number;
  eventCount: number;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  // Collect analytics data server-side
  const userAgent = getUserAgent(request);
  const location = getIpLocation(request);
  const analytics = prepareVisitAnalytics(userAgent, location, false); // isFirstVisit will be determined client-side

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  // Get slug from params (it will be undefined on index route)
  const slug = (params as { slug?: string }).slug;

  // If no slug parameter, return default/demo data
  if (!slug) {
    return {
      community: null,
      isOwner: false,
      isMember: false,
      user: user || null,
      analytics,
      memberCount: 0,
      eventCount: 0,
    };
  }

  // Fetch community by slug
  const { data: community, error } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !community) {
    throw new Response('Community not found', { status: 404 });
  }

  // Check if user is the owner
  const isOwner = user ? community.created_by === user.id : false;

  // Check if user is a member
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', community.id)
      .limit(1)
      .single();

    isMember = !!membership;
  }

  // Fetch real-time member count
  const { count: memberCount } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id);

  // Fetch real-time event count from events table
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)
    .eq('status', 'published');

  return {
    community,
    isOwner,
    isMember,
    user: user || null,
    analytics,
    memberCount: memberCount || 0,
    eventCount: eventCount || 0,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'track_visit') {
    try {
      const communityId = formData.get('communityId') as string;
      const sessionId = formData.get('sessionId') as string;
      const analyticsData = formData.get('analytics') as string;
      const analytics: VisitAnalytics = JSON.parse(analyticsData);

      // Get current user (will be null for anonymous)
      const { data: { user } } = await supabase.auth.getUser();

      // Insert visit record (non-blocking - we don't await)
      supabase.from('community_visits').insert({
        community_id: communityId,
        session_id: sessionId,
        user_id: user?.id || null,
        metadata: analytics as unknown as Database['public']['Tables']['community_visits']['Insert']['metadata'],
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to track visit:', error);
        }
      });

      // Return immediately (non-blocking)
      return { "": "" };
    } catch (error) {
      console.error('Visit tracking error:', error);
      return { success: false };
    }
  }

  if (intent === 'join_community') {
    try {
      const communityId = formData.get('communityId') as string;

      // Validate inputs
      if (!communityId) {
        return { success: false, error: 'Missing community ID' };
      }

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'You must be logged in to join a community' };
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('community_id', communityId)
        .limit(1);

      if (existingMembership && existingMembership.length > 0) {
        return { success: true, message: 'You are already a member!' };
      }

      // Add to community_members
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: communityId,
          role: 'member',
        });

      if (memberError) {
        console.error('Failed to add community member:', memberError);
        return { success: false, error: 'Failed to join community' };
      }

      return { success: true, message: 'Successfully joined the community!' };
    } catch (error) {
      console.error('Join community error:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  if (intent === 'leave_community') {
    try {
      const communityId = formData.get('communityId') as string;

      // Validate inputs
      if (!communityId) {
        return { success: false, error: 'Missing community ID' };
      }

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'You must be logged in to leave a community' };
      }

      // Remove from community_members
      const { error: deleteError } = await supabase
        .from('community_members')
        .delete()
        .eq('user_id', user.id)
        .eq('community_id', communityId);

      if (deleteError) {
        console.error('Failed to remove community member:', deleteError);
        return { success: false, error: 'Failed to leave community' };
      }

      return { success: true, message: 'You have left the community' };
    } catch (error) {
      console.error('Leave community error:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  return { success: false };
}

export function meta({ data }: { data?: LoaderData }) {
  const community = data?.community;
  return [
    { title: community ? `${community.name} - Luhive` : "Community Page - Luhive" },
    { name: "description", content: community?.description || "Build Communities that Matter" },
  ];
}

export default function Community() {
  const { community, isOwner, isMember, user, analytics, memberCount, eventCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isMobile = useIsMobile();
  const [showStickyButton, setShowStickyButton] = useState(!isMember && !isOwner);

  // Track visit on component mount
  useEffect(() => {
    if (!community?.id) return; // Don't track if no community

    // Check if we should track this visit (5-minute window)
    if (shouldTrackVisit(community.id)) {
      const sessionId = getSessionId();
      const firstVisit = isFirstVisit();

      // Update analytics with client-side isFirstVisit flag
      const fullAnalytics = {
        ...analytics,
        isFirstVisit: firstVisit,
      };

      // Submit visit tracking (non-blocking)
      const formData = new FormData();
      formData.append('intent', 'track_visit');
      formData.append('communityId', community.id);
      formData.append('sessionId', sessionId);
      formData.append('analytics', JSON.stringify(fullAnalytics));

      // Fire and forget - don't wait for response
      submit(formData, { method: 'post' });
    }
  }, [community?.id, analytics, submit]);

  // Show toast notifications based on action results
  useEffect(() => {
    if (actionData && 'success' in actionData) {
      if (actionData.success) {
        toast.success(actionData.message || 'Success!');
      } else if (actionData.error) {
        toast.error(actionData.error);
      }
    }
  }, [actionData]);



  // Check if navigating to dashboard - for global loading state
  const isDashboardLoading = navigation.state === "loading" &&
    navigation.location?.pathname.includes('/dashboard/')

  // Check if navigating to events page
  const isEventsLoading = navigation.state === "loading" &&
    navigation.location?.pathname.includes('/events')

  // Use community data if available, otherwise use default demo data
  const displayName = community?.name || "You Community Name";
  const displayTagline = community?.tagline || "Community Tagline";
  const displayDescription = community?.description || "Community Description";
  const displayLogo = community?.logo_url || '';
  const displayCover = community?.cover_url || '';
  const displayVerified = community?.verified || false;

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
                  <div className="flex items-center gap-2 px-3 py-1">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground text-sm">Dashboard</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>


            </TooltipProvider>

          </div>
        </div>
      </Activity>
      {/* Owner Dashboard Icon */}

      <main className={`w-full py-8 px-4 sm:px-6 lg:px-8 ${isMobile ? 'pb-32' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {/* Profile Card - Large */}
            <Card className="md:col-span-2 py-0 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none overflow-hidden">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Cover Picture */}
                {isOwner && community ? (
                  <CoverPictureUpload
                    communitySlug={community.slug}
                    currentCoverUrl={displayCover}
                    onCoverUpdate={() => revalidator.revalidate()}
                  />
                ) : (
                    <div className="relative w-full aspect-[4/1] max-h-32 sm:max-h-36 md:max-h-40 lg:max-h-44 bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background">
                    {displayCover ? (
                      <img
                        src={displayCover}
                        alt={`${displayName} cover`}
                          className="w-full h-full object-cover object-center"
                      />
                    ) : (
                          <div className="w-full h-full" />
                    )}
                  </div>
                )}

                {/* Profile Content */}
                <div className="pb-8 flex flex-col items-center justify-center text-center flex-1 space-y-4 -mt-10 sm:-mt-12">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={displayLogo} alt={displayName} />
                    <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 px-4">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{displayName}</h1>
                    <p className="text-base sm:text-lg text-primary font-medium">{displayTagline}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-pop rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                              aria-label="Website"
                              onClick={() => window.open(socialLinks?.website, '_blank', 'noopener,noreferrer')}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-popover border text-popover-foreground">
                            <p className="text-xs">{socialLinks?.website}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  </Activity>

                  <Activity mode={socialLinks?.instagram ? "visible" : "hidden"}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                              aria-label="Instagram"
                              onClick={() => window.open(socialLinks?.instagram, '_blank', 'noopener,noreferrer')}
                            >
                              <Instagram className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-popover border text-popover-foreground">
                            <p className="text-xs">{socialLinks?.instagram}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  </Activity>

                  <Activity mode={socialLinks?.linkedin ? "visible" : "hidden"}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                              aria-label="LinkedIn"
                              onClick={() => window.open(socialLinks?.linkedin, '_blank', 'noopener,noreferrer')}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-popover border text-popover-foreground">
                            <p className="text-xs">{socialLinks?.linkedin}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  </Activity>
                </div>
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
            <Card className="lg:col-span-2 lg:row-span-1 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isOwner ? (
                  <Button
                    className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background"
                    asChild
                  >
                    <Link to={`/dashboard/${community?.slug}`}>
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 opacity-90 text-foreground" />
                          <span className="text-foreground">Manage Your Community</span>
                        </span>
                      </span>
                    </Link>
                  </Button>
                ) : (
                    <JoinCommunityForm
                      communityId={community?.id || ''}
                      communityName={displayName}
                      userEmail={user?.email}
                      isLoggedIn={!!user}
                      isMember={isMember}
                    />
                )}

                <Button className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background">
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 opacity-90 text-foreground" />
                      <span className="text-foreground">Give a Feedback</span>
                    </span>

                  </span>
                </Button>

                <Button
                  className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 opacity-90 text-foreground" />
                      <span className="text-foreground">Copy Public Link</span>
                    </span>

                  </span>
                </Button>

              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card className="md:col-span-2 lg:col-span-3 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                  {community && (
                    <Button
                      asChild={!isEventsLoading}
                      variant="ghost"
                      size="sm"
                      disabled={isEventsLoading}
                      className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isEventsLoading ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="h-3.5 w-3.5" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <Link
                          to={`/c/${community.slug}/events`}
                          prefetch="intent"
                          state={{ community }}
                          className="flex items-center gap-1.5"
                        >
                          View All
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {community ? (
                  <Suspense fallback={<EventListSkeleton />}>
                    <EventList
                      communityId={community.id}
                      communitySlug={community.slug}
                      limit={3}
                    />
                  </Suspense>
                ) : (
                  <EventListSkeleton />
                )}
              </CardContent>
            </Card>

            {/* Recent Posts Card */}
            <Card className="md:col-span-2 lg:row-span-2 lg:col-span-1 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Megaphone className="h-5 w-5" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Hourglass className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Community announcements and updates will be available in a future release.
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        Learn More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Megaphone className="h-5 w-5" />
                          Announcements Feature
                        </DialogTitle>
                        <DialogDescription>
                          Learn about the upcoming announcements feature for your community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">Community Updates</h4>
                              <p className="text-sm text-muted-foreground">Share important news and updates with your community members.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">Priority Messaging</h4>
                              <p className="text-sm text-muted-foreground">Send urgent announcements that appear prominently in the community.</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">
                            This feature is currently in development and will be available in a future update.
                            Stay tuned for more community management tools!
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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

      {/* Sticky Mobile Join Button - Only show if not owner and not member */}
      {isMobile && community && showStickyButton && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-background/0 pointer-events-none transition-opacity duration-300 ease-in-out ${showStickyButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`pointer-events-auto max-w-md mx-auto transform transition-all duration-300 ease-in-out ${showStickyButton ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <JoinCommunityForm
              communityId={community.id}
              communityName={displayName}
              userEmail={user?.email}
              isLoggedIn={!!user}
              isMember={isMember}
              trigger={
                <Button
                  className="w-full py-6 rounded-xl shadow-lg hover:shadow-xl text-base font-semibold transition-all duration-200 bg-primary hover:bg-primary/90"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Join Our Community</span>
                  </span>
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}


