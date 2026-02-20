import { Link, useNavigate } from 'react-router';
import { Card, CardContent } from '~/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/shared/components/ui/tabs';
import { Skeleton } from '~/shared/components/ui/skeleton';
import { Button } from '~/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/shared/components/ui/avatar';
import { Calendar, MapPin, Users, Infinity, ArrowLeft, X } from 'lucide-react';
import { TopNavigation } from '~/shared/components/navigation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { Community, Event } from '~/shared/models/entity.types';

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventsListPageSkeletonProps {
	events: Event[];
	communitySlug: string;
	community?: Partial<Community> | null;
	user?: { id: string } | null;
	onEventClick?: (event: Event) => void;
}

// Shows existing events immediately + skeleton for remaining slots
export function EventsListPageSkeleton({ events, communitySlug, community, user, onEventClick }: EventsListPageSkeletonProps) {
	// Only show skeleton placeholders if we have fewer than 3 events (still loading)
	// Don't show skeletons if we already have events loaded
	const skeletonCount = events.length < 3 ? Math.max(0, 3 - events.length) : 0;
	const navigate = useNavigate();

	const handleBack = () => {
		navigate(`/c/${communitySlug}`, { replace: true });
	};

	return (
		<>
			{/* Top Navigation */}
			<div className='px-5'>
			<TopNavigation user={user} />
			</div>

			{/* Header - matches events layout */}
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
							{community?.name ? (
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
								<>
									<Skeleton className="h-10 w-10 rounded-full" />
									<div>
										<Skeleton className="h-5 w-20 mb-2" />
										<Skeleton className="h-4 w-32" />
									</div>
								</>
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

			{/* Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Tabs defaultValue="upcoming" className="w-full">
					<TabsList className="grid w-full max-w-md grid-cols-2">
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="past">Past</TabsTrigger>
					</TabsList>
					<TabsContent value="upcoming" className="mt-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{/* Show existing events */}
							{events.map((event) => (
								<EventGridCardPreview 
									key={event.id} 
									event={event} 
									communitySlug={communitySlug}
									onEventClick={onEventClick}
								/>
							))}
							{/* Show skeleton for remaining slots */}
							{Array.from({ length: skeletonCount }).map((_, i) => (
								<EventCardSkeleton key={`skeleton-${i}`} />
							))}
						</div>
					</TabsContent>
					<TabsContent value="past" className="mt-6">
						<EventsGridSkeleton />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}

// Preview version of EventGridCard for the skeleton overlay
function EventGridCardPreview({
	event,
	communitySlug,
	onEventClick,
}: {
	event: Event;
	communitySlug: string;
	onEventClick?: (event: Event) => void;
}) {
	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(event.timezone) : null;

	return (
		<Link 
			to={`/c/${communitySlug}/events/${event.id}`}
			state={{ event }}
			onClick={() => onEventClick?.(event)}
			className="group block"
		>
			<Card className="overflow-hidden pb-0 pt-0 gap-0 border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
				{/* Event Cover */}
				<div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden">
					{event.cover_url ? (
						<img
							src={event.cover_url}
							alt={event.title}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
							<Calendar className="h-16 w-16 text-primary/30" />
						</div>
					)}

					{/* Gradient Overlay for Text Readability */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90" />

					{/* Date Badge - Top Left */}
					<div className="absolute top-4 left-4 bg-white/95 dark:bg-black/90 backdrop-blur-sm rounded-lg shadow-xl p-3 min-w-[64px]">
						<div className="text-center">
							<p className="text-2xl font-bold text-primary leading-none">{eventDate.format('DD')}</p>
							<p className="text-xs font-semibold text-muted-foreground uppercase mt-1">
								{eventDate.format('MMM')}
							</p>
						</div>
					</div>

					{/* Event Title Overlay - Bottom */}
					<div className="absolute bottom-0 left-0 right-0 p-4">
						<h3 className="font-bold text-white text-xl leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
							{event.title}
						</h3>
						<div className="flex items-center gap-2 mt-2 text-white/90 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
							<Calendar className="h-3.5 w-3.5 shrink-0" />
							<span className="font-medium">
								{eventDate.format('h:mm A')}
								{eventEndDate && ` - ${eventEndDate.format('h:mm A')}`}
							</span>
						</div>
						{event.location_address && (
							<div className="flex items-center gap-2 mt-1 text-white/80 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="truncate font-medium">{event.location_address.split(',')[0]}</span>
							</div>
						)}
					</div>
				</div>

				<CardContent className="relative p-0 overflow-hidden">
					{/* Default View - Capacity & Event Type */}
					<div className="absolute inset-0 flex items-center justify-between gap-4 px-4 py-4 bg-background transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:translate-y-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							{event.capacity ? (
								<>
									<Users className="h-4 w-4 shrink-0" />
									<span className="font-medium">{event.capacity} spots</span>
								</>
							) : (
								<>
									<Infinity className="h-4 w-4 shrink-0" />
									<span className="font-medium">Unlimited</span>
								</>
							)}
						</div>
						{event.event_type && (
							<div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
								{event.event_type === 'in-person' && 'In-Person'}
								{event.event_type === 'online' && 'Online'}
								{event.event_type === 'hybrid' && 'Hybrid'}
							</div>
						)}
					</div>

					{/* Hover View - Join Button */}
					<div className="absolute inset-0 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
						<button className="w-full h-full relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground font-bold text-lg transition-all duration-300 hover:from-primary/90 hover:via-primary/80 hover:to-primary/90">
							<span className="relative z-10 flex items-center justify-center gap-2">
								<span>Join Event</span>
								<ArrowLeft className="h-5 w-5 rotate-180" />
							</span>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
						</button>
					</div>

					{/* Spacer to maintain height */}
					<div className="h-[56px]" />
				</CardContent>
			</Card>
		</Link>
	);
}

function EventCardSkeleton() {
	return (
		<Card className="overflow-hidden pb-0">
			<Skeleton className="bg-muted aspect-square w-full" />
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-4">
					<Skeleton className="bg-muted h-4 w-24" />
					<Skeleton className="bg-muted h-6 w-20 rounded-full" />
				</div>
			</CardContent>
		</Card>
	);
}

function EventsGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }).map((_, i) => (
				<EventCardSkeleton key={i} />
			))}
		</div>
	);
}

export default EventsListPageSkeleton;

