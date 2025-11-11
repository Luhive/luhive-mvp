import { useState, useEffect } from 'react';
import { useLoaderData, Link, Form, useActionData } from 'react-router';
import { redirect } from 'react-router';
import { createClient } from '~/lib/supabase.server';
import type { Route } from './+types/$slug.events.$eventId';
import type { Database } from '~/models/database.types';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Separator } from '~/components/ui/separator';
import { toast } from 'sonner';
import {
	Calendar,
	MapPin,
	Video,
	Combine,
	ExternalLink,
	CheckCircle2,
	Send,
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { cn } from '~/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

type Event = Database['public']['Tables']['events']['Row'];
type Community = Database['public']['Tables']['communities']['Row'];
type EventStatus = Database['public']['Enums']['event_status'];
type EventType = Database['public']['Enums']['event_type'];

interface LoaderData {
	event: Event;
	community: Community;
	registrationCount: number;
	isUserRegistered: boolean;
	canRegister: boolean;
	user: any;
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const { supabase, headers } = createClient(request);

	const slug = params.slug;
	const eventId = params.eventId;

	if (!slug || !eventId) {
		throw new Response('Not Found', { status: 404 });
	}

	// Get community by slug
	const { data: community, error: communityError } = await supabase
		.from('communities')
		.select('*')
		.eq('slug', slug)
		.single();

	if (communityError || !community) {
		throw new Response('Community not found', { status: 404 });
	}

	// Get event by ID and verify it belongs to this community
	const { data: event, error: eventError } = await supabase
		.from('events')
		.select('*')
		.eq('id', eventId)
		.eq('community_id', community.id)
		.single();

	if (eventError || !event) {
		throw new Response('Event not found', { status: 404 });
	}

	// Only show published events to public
	if (event.status !== 'published') {
		throw new Response('Event not available', { status: 404 });
	}

	// Get registration count
	const { count: registrationCount } = await supabase
		.from('event_registrations')
		.select('*', { count: 'exact', head: true })
		.eq('event_id', event.id);

	// Check if current user is registered
	const { data: { user } } = await supabase.auth.getUser();
	let isUserRegistered = false;

	if (user) {
		const { data: registration } = await supabase
			.from('event_registrations')
			.select('id')
			.eq('event_id', event.id)
			.eq('user_id', user.id)
			.single();

		isUserRegistered = !!registration;
	}

	// Check if registration is still open
	const now = new Date();
	const eventStartTime = new Date(event.start_time);
	const registrationDeadline = event.registration_deadline
		? new Date(event.registration_deadline)
		: eventStartTime;

	const canRegister =
		event.status === 'published' &&
		now < registrationDeadline &&
		(!event.capacity || (registrationCount || 0) < event.capacity);

	return {
		event,
		community,
		registrationCount: registrationCount || 0,
		isUserRegistered,
		canRegister,
		user: user || null,
	};
}

export async function action({ request, params }: Route.ActionArgs) {
	const { supabase } = createClient(request);
	const formData = await request.formData();
	const intent = formData.get('intent') as string;

	const eventId = params.eventId;
	if (!eventId) {
		return { success: false, error: 'Event ID required' };
	}

	// Check authentication
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return { success: false, error: 'Please login to register for this event' };
	}

	if (intent === 'register') {
		// Check if already registered
		const { data: existingRegistration } = await supabase
			.from('event_registrations')
			.select('id')
			.eq('event_id', eventId)
			.eq('user_id', user.id)
			.single();

		if (existingRegistration) {
			return { success: false, error: 'You are already registered for this event' };
		}

		// Register user
		const { error: registerError } = await supabase
			.from('event_registrations')
			.insert({
				event_id: eventId,
				user_id: user.id,
				rsvp_status: 'going',
				is_verified: true,
			});

		if (registerError) {
			return { success: false, error: registerError.message };
		}

		return { success: true, message: 'Successfully registered for the event!' };
	}

	if (intent === 'unregister') {
		const { error: unregisterError } = await supabase
			.from('event_registrations')
			.delete()
			.eq('event_id', eventId)
			.eq('user_id', user.id);

		if (unregisterError) {
			return { success: false, error: unregisterError.message };
		}

		return { success: true, message: 'Registration cancelled' };
	}

	return { success: false, error: 'Invalid action' };
}

export function meta({ data }: { data?: LoaderData }) {
	if (!data) {
		return [
			{ title: 'Event Not Found' },
			{ name: 'description', content: 'Event not found' },
		];
	}

	const { event, community } = data;
	const eventDate = dayjs(event.start_time).format('MMMM D, YYYY');

	return [
		{ title: `${event.title} - ${community.name}` },
		{ name: 'description', content: event.description || `Join ${event.title} hosted by ${community.name} on ${eventDate}` },
		{ property: 'og:title', content: `${event.title} - ${community.name}` },
		{ property: 'og:description', content: event.description || `Join ${event.title}` },
		{ property: 'og:image', content: event.cover_url || community.logo_url || '' },
		{ property: 'og:type', content: 'event' },
		{ name: 'twitter:card', content: 'summary_large_image' },
		{ name: 'twitter:title', content: `${event.title} - ${community.name}` },
		{ name: 'twitter:description', content: event.description || `Join ${event.title}` },
		{ name: 'twitter:image', content: event.cover_url || community.logo_url || '' },
	];
}

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
	draft: { label: 'Draft', variant: 'secondary' },
	published: { label: 'Published', variant: 'default' },
	cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const typeIcons: Record<EventType, { icon: React.ReactNode; label: string }> = {
	'in-person': { icon: <MapPin className="h-4 w-4" />, label: 'In-person' },
	online: { icon: <Video className="h-4 w-4" />, label: 'Online' },
	hybrid: { icon: <Combine className="h-4 w-4" />, label: 'Hybrid' },
};

export default function EventPublicView() {
	const { event, community, registrationCount, isUserRegistered, canRegister, user } =
		useLoaderData<LoaderData>();
	const actionData = useActionData<{ success: boolean; error?: string; message?: string }>();

	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time ? dayjs(event.end_time).tz(event.timezone) : null;
	const isPastEvent = eventDate.isBefore(dayjs());
	const capacityPercentage = event.capacity
		? Math.round((registrationCount / event.capacity) * 100)
		: 0;

	// Show toast notifications
	useEffect(() => {
		if (actionData) {
			if (actionData.success && actionData.message) {
				toast.success(actionData.message);
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: event.title,
					text: `Join ${event.title}`,
					url: window.location.href,
				});
			} catch (err) {
				console.error('Share failed:', err);
			}
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(window.location.href);
			toast.success('Link copied to clipboard!');
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<main className="w-full">
				{/* Content Container */}
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
					<div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
						{/* Left Sidebar - Cover & Host Info */}
						<div className="space-y-6">
							{/* Event Cover - Square */}
							<div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden rounded-xl border shadow-sm">
								{event.cover_url ? (
									<img
										src={event.cover_url}
										alt={event.title}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
										<Calendar className="h-16 w-16 text-primary/30" />
									</div>
								)}

								{/* Past Event Overlay */}
								{isPastEvent && (
									<div className="absolute inset-0 bg-black/60 flex items-center justify-center">
										<Badge variant="outline" className="bg-black/60 text-white border-white/20">
											Past Event
										</Badge>
									</div>
								)}
							</div>

							{/* Host Info */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-muted-foreground">Hosted By</h3>
								<Link
									to={`/c/${community.slug}`}
									className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
								>
									<Avatar className="h-10 w-10">
										<AvatarImage src={community.logo_url || ''} alt={community.name} />
										<AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
											{community.name.substring(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm truncate">{community.name}</p>
									</div>
								</Link>
								{event.capacity && (
									<div className="space-y-2 pt-6 border-t">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												{event.capacity - registrationCount} spots left
											</span>
											<span className="font-semibold">
												{registrationCount}/{event.capacity}
											</span>
										</div>
										<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
											<div
												className={cn(
													'h-full rounded-full transition-all duration-300',
													capacityPercentage >= 90
														? 'bg-red-500'
														: capacityPercentage >= 70
															? 'bg-yellow-500'
															: 'bg-primary'
												)}
												style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
											/>
										</div>
									</div>
								)}
							</div>



							{/* Contact & Share */}
							<div className="space-y-2">
								<Button
									onClick={handleShare}
									variant="outline"
									className="w-full"
									size="lg"
								>
									<Send className="h-4 w-4 mr-2" />
									Share Event
								</Button>
							</div>
						</div>

						{/* Main Content - Right Side */}
						<div className="space-y-6">
							{/* Event Title */}
							<div>
								<h1 className="text-3xl md:text-4xl font-bold leading-tight">
									{event.title}
								</h1>
							</div>

							{/* Date & Time */}
							<div className="flex items-start gap-3">
								<div className="mt-1">
									<Calendar className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="font-semibold text-base">
										{eventDate.format('dddd, MMMM D')}
									</p>
									<p className="text-sm text-muted-foreground">
										{eventDate.format('h:mm A')}
										{eventEndDate && ` - ${eventEndDate.format('h:mm A')}`} {event.timezone}
									</p>
								</div>
							</div>

							{/* Location */}
							{event.location_address && (
								<div className="flex items-start gap-3">
									<div className="mt-1">
										<MapPin className="h-5 w-5 text-muted-foreground" />
									</div>
									<div>
										<p className="font-semibold text-base">
											{event.location_address.split(',')[0]}
										</p>
										<p className="text-sm text-muted-foreground">
											{event.location_address.split(',').slice(1).join(',').trim()}
										</p>
									</div>
								</div>
							)}

							<Separator />

							{/* Registration Section */}
							<div className="space-y-4">
								<h2 className="text-xl font-semibold">Registration</h2>

								<Card className="bg-card/50">
									<CardContent className="p-6 space-y-4">
										{isUserRegistered ? (
											<>
												<div className="flex items-center gap-2 text-green-600 dark:text-green-500">
													<CheckCircle2 className="h-5 w-5" />
													<span className="font-semibold">You're registered for this event!</span>
												</div>

												{event.capacity && (
													<div className="flex items-center justify-between text-sm pt-3 border-t">
														<span className="text-muted-foreground">Capacity</span>
														<span className="font-semibold">
															{registrationCount}/{event.capacity}
														</span>
													</div>
												)}

												<Form method="post" className="pt-2">
													<input type="hidden" name="intent" value="unregister" />
													<Button
														type="submit"
														variant="outline"
														className="w-full"
													>
														Cancel Registration
													</Button>
												</Form>
											</>
										) : (
											<>
												{canRegister ? (
													<>
														<p className="text-sm text-muted-foreground">
															Welcome! To join the event, please register below.
														</p>

														{user && (
															<div className="flex items-center gap-2 text-sm">
																<Avatar className="h-6 w-6">
																	<AvatarFallback className="bg-primary/10 text-primary text-xs">
																		{user.email?.charAt(0).toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<span className="text-muted-foreground">{user.email}</span>
															</div>
														)}

														{user ? (
															<Form method="post">
																<input type="hidden" name="intent" value="register" />
																<Button
																	type="submit"
																	className="w-full"
																	size="lg"
																>
																	One-Click RSVP
																</Button>
															</Form>
														) : (
															<Button
																asChild
																className="w-full"
																size="lg"
															>
																<Link to={`/login?redirect=/c/${community.slug}/events/${event.id}`}>
																	Login to Register
																</Link>
															</Button>
														)}

													</>
												) : (
													<div className="text-center py-6">
														<p className="text-sm font-medium text-muted-foreground">
															{isPastEvent
																? 'This event has ended'
																: event.capacity && registrationCount >= event.capacity
																	? 'Event is at full capacity'
																	: 'Registration is closed'}
														</p>
													</div>
												)}
											</>
										)}
									</CardContent>
								</Card>
							</div>

							{/* About Event */}
							{event.description && (
								<div className="space-y-4">
									<h2 className="text-xl font-semibold">About Event</h2>
									<div className="prose prose-sm max-w-none">
										<p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
											{event.description}
										</p>
									</div>
								</div>
							)}

							{/* Online Meeting */}
							{(event.event_type === 'online' || event.event_type === 'hybrid') &&
								event.online_meeting_link && (
									<div className="space-y-3 pt-4 border-t">
										<h3 className="text-base font-semibold flex items-center gap-2">
											<Video className="h-4 w-4" />
											Online Meeting
										</h3>
										{isUserRegistered ? (
											<Button asChild variant="outline" className="w-full" size="sm">
												<a href={event.online_meeting_link} target="_blank" rel="noopener noreferrer">
													Join Meeting
													<ExternalLink className="h-4 w-4 ml-2" />
												</a>
											</Button>
										) : (
											<p className="text-sm text-muted-foreground">
												Register to access the meeting link
											</p>
										)}
									</div>
								)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

