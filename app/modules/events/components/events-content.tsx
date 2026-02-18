import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { Database } from '~/shared/models/database.types';
import { Card, CardContent } from '~/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/shared/components/ui/tabs';
import { Skeleton } from '~/shared/components/ui/skeleton';
import { Calendar, MapPin, Users, CalendarX, Infinity, ArrowLeft } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { cn } from '~/shared/lib/utils';
import { getEventsByCommunityClient } from '~/modules/events/data/events-repo.client';

dayjs.extend(utc);
dayjs.extend(timezone);

type Event = Database['public']['Tables']['events']['Row'];
type Community = Database['public']['Tables']['communities']['Row'];

interface EventsContentProps {
	community: Community | null;
	loading: boolean;
	slug: string;
	initialEvents?: Event[];
	onEventClick?: (event: Event) => void;
}

export function EventsContent({ community, loading, slug, initialEvents = [], onEventClick }: EventsContentProps) {
	// Use initial events if provided (instant display from navigation state)
	const hasInitialEvents = initialEvents.length > 0;
	const [upcomingEvents, setUpcomingEvents] = useState<Event[]>(initialEvents);
	const [pastEvents, setPastEvents] = useState<Event[]>([]);
	// Skip loading state if we have initial events
	const [loadingUpcoming, setLoadingUpcoming] = useState(!hasInitialEvents);
	const [loadingPast, setLoadingPast] = useState(true);
	const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

	useEffect(() => {
		if (!community?.id) return;

		async function fetchUpcomingEvents() {
			if (!community) return;

			try {
				const now = new Date().toISOString();

        const { events: data, error } = await getEventsByCommunityClient(community.id, {
          status: 'published',
          startTimeGte: now,
          order: { column: 'start_time', ascending: true },
        });

				if (error) {
					console.error('Error fetching upcoming events:', error);
					// Keep initial events if fetch fails
					if (!hasInitialEvents) setUpcomingEvents([]);
				} else {
					// Update with fresh data (may include more events than initial)
					setUpcomingEvents(data || []);
				}
			} catch (error) {
				console.error('Error fetching upcoming events:', error);
				if (!hasInitialEvents) setUpcomingEvents([]);
			} finally {
				setLoadingUpcoming(false);
			}
		}

		fetchUpcomingEvents();
	}, [community?.id, hasInitialEvents]);

	useEffect(() => {
		if (!community?.id) return;

		async function fetchPastEvents() {
			if (!community) return;

			try {
				const now = new Date().toISOString();

        const { events: data, error } = await getEventsByCommunityClient(community.id, {
          status: 'published',
          startTimeLt: now,
          order: { column: 'start_time', ascending: false },
        });

				if (error) {
					console.error('Error fetching past events:', error);
					setPastEvents([]);
				} else {
					setPastEvents(data || []);
				}
			} catch (error) {
				console.error('Error fetching past events:', error);
				setPastEvents([]);
			} finally {
				setLoadingPast(false);
			}
		}

		// Only fetch past events when tab is clicked
		if (activeTab === 'past') {
			fetchPastEvents();
		}
	}, [community?.id, activeTab]);

	// Show UI immediately with skeletons while community is loading
	// This allows instant rendering without blocking on data
	if (loading || !community) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Tabs defaultValue="upcoming" className="w-full">
					<TabsList className="grid w-full max-w-md grid-cols-2">
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="past">Past</TabsTrigger>
					</TabsList>
					<TabsContent value="upcoming" className="mt-6">
						<EventsGridSkeleton />
					</TabsContent>
					<TabsContent value="past" className="mt-6">
						<EventsGridSkeleton />
					</TabsContent>
				</Tabs>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<Tabs
				defaultValue="upcoming"
				className="w-full"
				onValueChange={(value) => setActiveTab(value as 'upcoming' | 'past')}
			>
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
					<TabsTrigger value="past">Past</TabsTrigger>
				</TabsList>

				<TabsContent value="upcoming" className="mt-6">
					{loadingUpcoming ? (
						<EventsGridSkeleton />
					) : upcomingEvents.length === 0 ? (
						<EmptyState
							icon={CalendarX}
							title="No Upcoming Events"
							description="There are no upcoming events scheduled at the moment. Check back later!"
						/>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{upcomingEvents.map((event) => (
								<EventGridCard 
									key={event.id} 
									event={event} 
									communitySlug={slug}
									onEventClick={onEventClick}
								/>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="past" className="mt-6">
					{loadingPast ? (
						<EventsGridSkeleton />
					) : pastEvents.length === 0 ? (
						<EmptyState icon={CalendarX} title="No Past Events" description="No past events to display yet." />
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{pastEvents.map((event) => (
								<EventGridCard 
									key={event.id} 
									event={event} 
									communitySlug={slug} 
									isPast
									onEventClick={onEventClick}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function EventGridCard({
	event,
	communitySlug,
	isPast = false,
	onEventClick,
}: {
	event: Event;
	communitySlug: string;
	isPast?: boolean;
	onEventClick?: (event: Event) => void;
}) {
	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(event.timezone) : null;

	// If onEventClick is provided, render as a button to prevent navigation
	// and let the parent handle the click (e.g., open sidebar)
	if (onEventClick) {
		return (
			<button
				type="button"
				onClick={() => onEventClick(event)}
				className="group block w-full text-left cursor-pointer"
			>
				<EventGridCardContent 
					event={event}
					eventDate={eventDate}
					eventEndDate={eventEndDate}
					isPast={isPast}
				/>
			</button>
		);
	}

	return (
		<Link 
			to={`/c/${communitySlug}/events/${event.id}`}
			state={{ event }}
			className="group block">
			<EventGridCardContent 
				event={event}
				eventDate={eventDate}
				eventEndDate={eventEndDate}
				isPast={isPast}
			/>
		</Link>
	);
}

// Extracted content component to avoid duplication
function EventGridCardContent({
	event,
	eventDate,
	eventEndDate,
	isPast = false,
}: {
	event: Event;
	eventDate: Dayjs;
	eventEndDate: Dayjs | null;
	isPast?: boolean;
}) {
	return (
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
						<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
						<span className="font-medium">
							{eventDate.format('h:mm A')}
							{eventEndDate && ` - ${eventEndDate.format('h:mm A')}`}
						</span>
					</div>
					{event.location_address && (
						<div className="flex items-center gap-2 mt-1 text-white/80 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
							<MapPin className="h-3 w-3 flex-shrink-0" />
							<span className="truncate font-medium">{event.location_address.split(',')[0]}</span>
						</div>
					)}
				</div>

				{isPast && (
					<div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
						Past Event
					</div>
				)}
			</div>

			<CardContent className="relative p-0 overflow-hidden">
				{/* Default View - Capacity & Event Type */}
				<div className="absolute inset-0 flex items-center justify-between gap-4 px-4 py-4 bg-background transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:translate-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{event.capacity ? (
							<>
								<Users className="h-4 w-4 flex-shrink-0" />
								<span className="font-medium">{event.capacity} spots</span>
							</>
						) : (
							<>
								<Infinity className="h-4 w-4 flex-shrink-0" />
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
					<div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground font-bold text-lg transition-all duration-300 hover:from-primary/90 hover:via-primary/80 hover:to-primary/90 flex items-center justify-center">
						<span className="relative z-10 flex items-center justify-center gap-2">
							<span>Join Event</span>
							<ArrowLeft className="h-5 w-5 rotate-180" />
						</span>
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
					</div>
				</div>

				{/* Spacer to maintain height */}
				<div className="h-[56px]" />
			</CardContent>
		</Card>
	);
}

function EventsGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={i} className="overflow-hidden pb-0">
					<Skeleton className="bg-muted aspect-square w-full" />
					<CardContent className="p-4">
						<div className="flex items-center justify-between gap-4">
							<Skeleton className="bg-muted h-4 w-24" />
							<Skeleton className="bg-muted h-6 w-20 rounded-full" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
				<Icon className="h-10 w-10 text-muted-foreground" />
			</div>
			<h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground max-w-md">{description}</p>
		</div>
	);
}

