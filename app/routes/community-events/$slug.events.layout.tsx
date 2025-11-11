import type { Route } from './+types/$slug.events.layout';
import { useLoaderData, Outlet, useNavigate, useMatches, useLocation } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '~/lib/supabase.client';
import type { Database } from '~/models/database.types';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Skeleton } from '~/components/ui/skeleton';
import { ArrowLeft, X } from 'lucide-react';

type Community = Database['public']['Tables']['communities']['Row'];

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

	return (
		<div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
			<div className="h-full overflow-y-auto">
				<div className="animate-in slide-in-from-bottom duration-500 ease-out">
					<div className="min-h-screen bg-background">
						{/* Header - Shows Instantly */}
						<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
						</div>

						{/* Content Area - Loads Progressively */}
						<Outlet context={{ community, loading, slug }} />
					</div>
				</div>
			</div>
		</div>
	);
}

