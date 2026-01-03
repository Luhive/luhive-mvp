import type { Route } from './+types/$slug.events.layout';
import { useLoaderData, Outlet, useNavigate, useMatches, useLocation, useNavigation } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '~/lib/supabase.client';
import type { Database } from '~/models/database.types';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Skeleton } from '~/components/ui/skeleton';
import { ArrowLeft, X } from 'lucide-react';
import { EventPageSkeleton } from '~/components/events/event-page-skeleton';
import { EventPreviewSidebar } from '~/components/events/event-preview-sidebar';

type Community = Database['public']['Tables']['communities']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface LoaderData {
	slug: string;
}

interface CommunityLoaderData {
	community: Community | null;
	isOwner: boolean;
	user: { id: string } | null;
	memberCount: number;
	eventCount: number;
}

export async function loader({ params }: Route.LoaderArgs) {
	const slug = params.slug;

	if (!slug) {
		throw new Response('Not Found', { status: 404 });
	}

	// Just return slug - instant navigation
	return { slug };
}

export default function EventsLayout() {
	const { slug } = useLoaderData<LoaderData>();
	const navigate = useNavigate();
	const matches = useMatches();
	const location = useLocation();
	const navigation = useNavigation();
	
	// State for event preview sidebar
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isEventSidebarOpen, setIsEventSidebarOpen] = useState(false);
	
	// State for instant event navigation overlay (when navigating from sidebar)
	const [pendingEvent, setPendingEvent] = useState<Event | null>(null);
	
	// Priority 1: Get community from navigation state (instant when navigating from community page)
	// Priority 2: Get from parent route matches
	// Priority 3: Fetch client-side (only if direct URL access)
	const navigationStateCommunity = (location.state as any)?.community as Community | null;
	
	const parentCommunityData = useMemo(() => {
		for (const match of matches) {
			const data = match.data as any;
			if (data && 'community' in data && data.community) {
				return data as CommunityLoaderData;
			}
		}
		return null;
	}, [matches]);
	
	const [community, setCommunity] = useState<Community | null>(
		navigationStateCommunity || parentCommunityData?.community || null
	);
	const [loading, setLoading] = useState(!navigationStateCommunity && !parentCommunityData?.community);

	useEffect(() => {
		// If we have community from navigation state, use it immediately
		if (navigationStateCommunity) {
			setCommunity(navigationStateCommunity);
			setLoading(false);
			return;
		}
		
		// If we have community from parent, use it
		if (parentCommunityData?.community) {
			setCommunity(parentCommunityData.community);
			setLoading(false);
			return;
		}

		// Only fetch if we don't have it (direct URL access)
		async function fetchCommunity() {
			try {
				const supabase = createClient();
				const { data } = await supabase
					.from('communities')
					.select('*')
					.eq('slug', slug)
					.single();

				setCommunity(data);
			} catch (error) {
				console.error('Error fetching community:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchCommunity();
	}, [slug, navigationStateCommunity, parentCommunityData]);

	const handleBack = () => {
		navigate(`/c/${slug}`, { replace: true });
	};

	// Clear pending event when navigation completes
	useEffect(() => {
		if (navigation.state === "idle") {
			setPendingEvent(null);
		}
	}, [navigation.state]);

	return (
		<>
			{/* Instant Event Navigation Overlay */}
			{pendingEvent && community && (
				<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
					<div className="min-h-screen container mx-auto px-4 sm:px-8">
						<EventPageSkeleton 
							event={pendingEvent} 
							community={community}
						/>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="py-4 border-b">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleBack}
							className="h-9 w-9"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div className="flex items-center gap-3">
							{loading ? (
								<>
									<Skeleton className="h-10 w-10 rounded-full" />
									<div>
										<Skeleton className="h-5 w-20 mb-2" />
										<Skeleton className="h-4 w-32" />
									</div>
								</>
							) : community ? (
								<>
									<Avatar className="h-10 w-10">
										<AvatarImage src={community.logo_url || ''} alt={community.name} />
										<AvatarFallback className="bg-primary/10 text-primary text-sm">
											{community.name.substring(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<h1 className="text-xl font-bold">Events</h1>
										<p className="text-sm text-muted-foreground">{community.name}</p>
									</div>
								</>
							) : (
								<div>
									<h1 className="text-xl font-bold">Events</h1>
									<p className="text-sm text-muted-foreground">Loading...</p>
								</div>
							)}
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleBack}
						className="h-9 w-9"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
			</div>

			{/* Content Area */}
			<Outlet context={{ 
				community, 
				loading, 
				slug, 
				onEventClick: (event: Event) => {
					setSelectedEvent(event);
					setIsEventSidebarOpen(true);
				}
			}} />

			{/* Event Preview Sidebar */}
			<EventPreviewSidebar
				event={selectedEvent}
				community={community}
				open={isEventSidebarOpen}
				onOpenChange={(open) => {
					setIsEventSidebarOpen(open);
					if (!open) {
						setSelectedEvent(null);
					}
				}}
				onNavigateToEvent={() => {
					if (selectedEvent) {
						setPendingEvent(selectedEvent);
					}
				}}
			/>
		</>
	);
}

