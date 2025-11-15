import type { Route } from "./+types/hub";
import { useLoaderData, Link } from "react-router";
import { createClient } from "~/lib/supabase.server";
import type { Database } from "~/models/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Users,
  Calendar,
  BadgeCheck,
  Heart,
  Sparkle,
} from "lucide-react";
import { ShimmeringText } from "~/components/ui/shimmering-text";

type Community = Database['public']['Tables']['communities']['Row'] & {
  memberCount: number;
  eventCount: number;
};

type LoaderData = {
  communities: Community[];
  user: { id: string } | null;
};

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all communities
  const { data: communities, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communities:', error);
    return {
      communities: [],
      user: user || null,
    };
  }

  if (!communities || communities.length === 0) {
    return {
      communities: [],
      user: user || null,
    };
  }

  // Batch fetch all member and event counts in parallel (fixes N+1 query problem)
  const communityIds = communities.map(c => c.id);

  const [memberCountsResult, eventCountsResult] = await Promise.all([
    // Fetch all memberships for all communities in one query
    supabase
      .from('community_members')
      .select('community_id')
      .in('community_id', communityIds),
    // Fetch all published events for all communities in one query
    supabase
      .from('events')
      .select('community_id')
      .in('community_id', communityIds)
      .eq('status', 'published')
  ]);

  // Count members per community
  const memberCounts = new Map<string, number>();
  (memberCountsResult.data || []).forEach(member => {
    const count = memberCounts.get(member.community_id!) || 0;
    memberCounts.set(member.community_id!, count + 1);
  });

  // Count events per community
  const eventCounts = new Map<string, number>();
  (eventCountsResult.data || []).forEach(event => {
    const count = eventCounts.get(event.community_id) || 0;
    eventCounts.set(event.community_id, count + 1);
  });

  // Combine data
  const communitiesWithCounts = communities.map(community => ({
    ...community,
    memberCount: memberCounts.get(community.id) || 0,
    eventCount: eventCounts.get(community.id) || 0,
  }));

  return {
    communities: communitiesWithCounts,
    user: user || null,
  };
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    { title: "Hub - Luhive" },
    { name: "description", content: "Discover and explore communities on Luhive" },
  ];
}

export default function Hub() {
  const { communities, user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Sparkle className="h-8 w-8 mb-2 text-primary animate-sparkle" />  
              <h1 className="text-4xl font-black tracking-tight mb-2">Explore Communities</h1>
            </div>
            {/* [a] */}
            <p className="text-lg text-muted-foreground">
              Discover amazing communities and connect with like-minded people
            </p>
          </div>

          {communities.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No communities found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => {
                  const memberCount = community.memberCount || 0;
                  const eventCount = community.eventCount || 0;

                return (
                  <Link
                    key={community.id}
                    to={`/c/${community.slug}`}
                    className="group"
                  >
                    <Card className="h-full cursor-pointer border hover:border-primary/30 transition-all duration-200 shadow-none hover:shadow-md group transform-gpu hover:scale-[1.02] hover:-rotate-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 border-2">
                            <AvatarImage src={community.logo_url || ''} alt={community.name} />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl font-bold text-foreground mb-1 truncate">
                              {community.name}
                            </CardTitle>
                            {community.tagline && (
                              <p className="text-sm text-primary font-medium truncate">
                                {community.tagline}
                              </p>
                            )}
                          </div>
                        </div>
                        {community.verified && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 py-1 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 px-2 text-xs"
                            >
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-primary/30 text-primary px-2 py-1 text-xs"
                            >
                              <Heart className="h-3 w-3" />
                              First Adopter
                            </Badge>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {community.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {community.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{eventCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}