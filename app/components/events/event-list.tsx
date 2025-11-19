import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { createClient } from '~/lib/supabase.client';
import type { Database } from '~/models/database.types';
import { Badge } from '~/components/ui/badge';
import { Calendar, MapPin, Users, CalendarX } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

type Event = Database['public']['Tables']['events']['Row'];

interface EventListProps {
	communityId: string;
	communitySlug: string;
	limit?: number;
}

export function EventList({ communityId, communitySlug, limit = 3 }: EventListProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchEvents() {
			try {
				const supabase = createClient();
				const now = new Date().toISOString();

				const { data, error } = await supabase
					.from('events')
					.select('*')
					.eq('community_id', communityId)
					.eq('status', 'published')
					.gte('start_time', now)
					.order('start_time', { ascending: false })
					.limit(limit);

				if (error) {
					console.error('Error fetching events:', error);
					setEvents([]);
				} else {
					setEvents(data || []);
				}
			} catch (error) {
				console.error('Error fetching events:', error);
				setEvents([]);
			} finally {
				setLoading(false);
			}
		}

		fetchEvents();
	}, [communityId, limit]);

	if (loading) {
		return <EventListSkeleton count={3} />;
	}

	if (events.length === 0) {
		return <EventListEmpty />;
	}

	return (
		<div className="space-y-3">
			{events.map((event) => (
				<EventCard
					key={event.id}
					event={event}
					communitySlug={communitySlug}
				/>
			))}
		</div>
	);
}

function EventCard({ event, communitySlug }: { event: Event; communitySlug: string }) {
	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(event.timezone) : null;

	return (
		<Link
			to={`/c/${communitySlug}/events/${event.id}`}
			className="block p-4 rounded-lg border bg-card hover:border-accent/50 hover:shadow-md hover:shadow-accent/20 active:shadow-none transition-all duration-400 group"
		>
			<div className="flex gap-4">
				{/* Event Cover - Small Square */}
				<div className="relative aspect-square w-20 h-20 flex-shrink-0 bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden rounded-lg border">
					{event.cover_url ? (
						<img
							src={event.cover_url}
							alt={event.title}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
							<Calendar className="h-8 w-8 text-primary/30" />
						</div>
					)}
				</div>

				{/* Event Details */}
				<div className="flex-1 min-w-0 space-y-2">
					<h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
						{event.title}
					</h3>

					{/* Date & Time */}
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
						<span className="truncate">
							{eventDate.format('MMM D, YYYY')} • {eventDate.format('h:mm A')}
							{eventEndDate && ` - ${eventEndDate.format('h:mm A')}`}
						</span>
					</div>

					{/* Location */}
					{event.location_address && (
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<MapPin className="h-3.5 w-3.5 flex-shrink-0" />
							<span className="truncate">
								{event.location_address.split(',')[0]}
							</span>
						</div>
					)}

					{/* Capacity */}
					{event.capacity && (
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Users className="h-3.5 w-3.5 flex-shrink-0" />
							<span>{event.capacity} spots</span>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}

export function EventListSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="p-4 rounded-lg border bg-card">
					<div className="flex gap-4">
						<Skeleton className="bg-muted aspect-square w-20 h-20 flex-shrink-0 rounded-lg" />
						<div className="flex-1 min-w-0 space-y-2.5">
							<Skeleton className="bg-mutedh-4 w-3/4" />
							<Skeleton className="bg-muted h-3 w-full" />
							<Skeleton className="bg-muted h-3 w-2/3" />
							<Skeleton className="bg-muted h-3 w-1/2" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function EventListEmpty() {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
				<CalendarX className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="font-semibold text-foreground mb-2">No Upcoming Events</h3>
			<p className="text-sm text-muted-foreground max-w-sm">
				This community has no upcoming events scheduled at the moment. Check back later for new events!
			</p>
		</div>
	);
}
