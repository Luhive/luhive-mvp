import type { Route } from "./+types/event-detail";
import type { Database } from "~/shared/models/database.types";

export { loader } from "~/modules/events/server/event-detail-loader.server";
export { action } from "~/modules/events/server/event-detail-action.server";
export { meta } from "~/modules/events/model/event-detail-meta";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Community = Database["public"]["Tables"]["communities"]["Row"];

export async function clientLoader({ serverLoader, params }: Route.ClientLoaderArgs) {
	const navigationState = window.history.state?.usr as { event?: Event } | null;
	const passedEvent = navigationState?.event;
	if (passedEvent) {
		return {
			event: passedEvent,
			community: { slug: params.slug } as Community,
			origin: window.location.origin,
			userData: null,
			_fromNavigationState: true,
		};
	}
	return serverLoader();
}
clientLoader.hydrate = true;

import { useState, useEffect, Activity, Suspense, lazy } from "react";
import {
	useLoaderData,
	Link,
	Form,
	useActionData,
	useSearchParams,
	useNavigation,
	useLocation,
	Await,
	useSubmit,
} from "react-router";
import { createClient as createClientBrowser } from "~/shared/lib/supabase/client";
import type {
	DeferredUserData,
	EventDetailLoaderData,
} from "~/modules/events/server/event-detail-loader.server";
import { Card, CardContent, CardHeader } from "~/shared/components/ui/card";
import { Button } from "~/shared/components/ui/button";
import { Badge } from "~/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Separator } from "~/shared/components/ui/separator";
import { toast } from "sonner";
import {
	Calendar,
	MapPin,
	Video,
	Combine,
	ExternalLink,
	CheckCircle2,
	Send,
	Settings,
	PersonStanding,
	Hourglass,
	CalendarClock,
	AlertTriangle,
	Users,
} from "lucide-react";
import {
	detectDiscussionPlatform,
	getPlatformName,
	getPlatformIcon,
} from "~/modules/events/utils/discussion-platform";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { getExternalPlatformIcon, getExternalPlatformName } from "~/modules/events/utils/external-platform";
import { Bell } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { cn, getTimeRemaining } from "~/shared/lib/utils";
import { AnonymousRegistrationDialog } from "~/modules/events/components/anonymous-registration-dialog";
import { AnonymousSubscriptionDialog } from "~/modules/events/components/anonymous-subscription-dialog";
import { CustomQuestionsForm } from "~/modules/events/components/custom-questions-form";
import { AttendersAvatarsSkeleton } from "~/modules/events/components/attenders-avatars";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { EventPageSkeleton } from "~/modules/events/components/event-page-skeleton";
import { CommunityPageSkeleton } from "~/modules/community/components/community-page-skeleton";
import { TopNavigation } from "~/shared/components/navigation";

import CheckIcon3D from '~/assets/images/TickIcon.png'

// Lazy load the attenders avatars component
const AttendersAvatars = lazy(() =>
	import("~/modules/events/components/attenders-avatars").then((module) => ({
		default: module.default,
	}))
);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

type EventStatus = Database["public"]["Enums"]["event_status"];
type EventType = Database["public"]["Enums"]["event_type"];

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type LoaderData = Omit<EventDetailLoaderData, "userData"> & {
	userData: Promise<DeferredUserData> | null;
	_fromNavigationState?: boolean;
};

const statusConfig: Record<
	EventStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" }
> = {
	draft: { label: "Draft", variant: "secondary" },
	published: { label: "Published", variant: "default" },
	cancelled: { label: "Cancelled", variant: "destructive" },
};

const typeIcons: Record<EventType, { icon: React.ReactNode; label: string }> = {
	"in-person": { icon: <MapPin className="h-4 w-4" />, label: "In-person" },
	online: { icon: <Video className="h-4 w-4" />, label: "Online" },
	hybrid: { icon: <Combine className="h-4 w-4" />, label: "Hybrid" },
};

export default function EventPublicView() {
	const loaderData = useLoaderData<LoaderData>();
	const location = useLocation();

	// Use passed event from navigation state as fallback for instant display
	const passedEvent = (location.state as { event?: Event } | null)?.event;
	const event = loaderData.event || passedEvent;
	const community = loaderData.community;

	// State for client-side fetched user data (when using instant navigation)
	const [clientUserData, setClientUserData] = useState<DeferredUserData | null>(null);
	const [isLoadingUserData, setIsLoadingUserData] = useState(loaderData.userData === null);
	
	// State for community data with counts (for skeleton)
	const [communityData, setCommunityData] = useState<{
		community: Community;
		memberCount: number;
		eventCount: number;
		description?: string;
		verified?: boolean;
	} | null>(null);
	const [pendingCommunity, setPendingCommunity] = useState<{
		community: Community;
		memberCount: number;
		eventCount: number;
		description?: string;
		verified?: boolean;
	} | null>(null);
	
	const navigation = useNavigation();

	// Fetch user data client-side when using instant navigation (userData is null)
	useEffect(() => {
		if (loaderData.userData !== null || !event) return;

		async function fetchUserData() {
			try {
				const supabase = createClientBrowser();

				// Get registration count
				const { count: registrationCount } = await supabase
					.from("event_registrations")
					.select("*", { count: "exact", head: true })
					.eq("event_id", event.id)
					.eq("approval_status", "approved");

				// Check if current user is registered
				const {
					data: { user },
				} = await supabase.auth.getUser();
				let isUserRegistered = false;
				let userRegistrationStatus: string | null = null;
				let isOwnerOrAdmin = false;
				let userProfile: Profile | null = null;

				if (user) {
					const { data: registration } = await supabase
						.from("event_registrations")
						.select("id, approval_status")
						.eq("event_id", event.id)
						.eq("user_id", user.id)
						.single();

					isUserRegistered = !!registration;
					userRegistrationStatus = registration?.approval_status || null;

					// Check if user is owner or admin of the community
					const { data: membership } = await supabase
						.from("community_members")
						.select("role")
						.eq("community_id", event.community_id)
						.eq("user_id", user.id)
						.single();

					isOwnerOrAdmin =
						membership?.role === "owner" || membership?.role === "admin";

					// Fetch user profile
					const { data: profile } = await supabase
						.from("profiles")
						.select("*")
						.eq("id", user.id)
						.single();

					userProfile = profile || null;
				}

				// Check if registration is still open
				const now = new Date();
				const eventStartTime = new Date(event.start_time);
				const registrationDeadline = event.registration_deadline
					? new Date(event.registration_deadline)
					: eventStartTime;

				const canRegister =
					event.status === "published" &&
					now < registrationDeadline &&
					(!event.capacity || (registrationCount || 0) < event.capacity);

				setClientUserData({
					registrationCount: registrationCount || 0,
					isUserRegistered,
					userRegistrationStatus,
					canRegister,
					user: user || null,
					userProfile,
					isOwnerOrAdmin,
				});
			} catch (error) {
				console.error("Error fetching user data:", error);
				setClientUserData({
					registrationCount: 0,
					isUserRegistered: false,
					userRegistrationStatus: null,
					canRegister: false,
					user: null,
					userProfile: null,
					isOwnerOrAdmin: false,
				});
			} finally {
				setIsLoadingUserData(false);
			}
		}

		fetchUserData();
	}, [event, loaderData.userData]);

	// Fetch community data (memberCount, eventCount) when event/community is available
	useEffect(() => {
		if (!community || !community.id) return;

		async function fetchCommunityData() {
			try {
				const supabase = createClientBrowser();

				// Fetch member count and event count in parallel
				const [memberCountResult, eventCountResult] = await Promise.all([
					supabase
						.from('community_members')
						.select('*', { count: 'exact', head: true })
						.eq('community_id', community.id),
					supabase
						.from('events')
						.select('*', { count: 'exact', head: true })
						.eq('community_id', community.id)
						.eq('status', 'published')
				]);

				const memberCount = memberCountResult.count || 0;
				const eventCount = eventCountResult.count || 0;

				setCommunityData({
					community,
					memberCount,
					eventCount,
					description: community.description || undefined,
					verified: community.verified || false,
				});
			} catch (error) {
				console.error('Error fetching community data:', error);
				// Set with default values if fetch fails
				setCommunityData({
					community,
					memberCount: 0,
					eventCount: 0,
					description: community.description || undefined,
					verified: community.verified || false,
				});
			}
		}

		fetchCommunityData();
	}, [community]);

	// Watch for navigation state changes to show skeleton instantly (like hub page)
	useEffect(() => {
		if (navigation.state === "loading" && navigation.location?.pathname.startsWith('/c/') && !navigation.location?.pathname.includes('/events')) {
			const navState = navigation.location.state as {
				community?: Community;
				memberCount?: number;
				eventCount?: number;
				description?: string;
				verified?: boolean;
			} | undefined;

			if (navState?.community) {
				setPendingCommunity({
					community: navState.community,
					memberCount: navState.memberCount || 0,
					eventCount: navState.eventCount || 0,
					description: navState.description,
					verified: navState.verified,
				});
			} else if (communityData) {
				// Use stored community data if navigation state doesn't have it
				setPendingCommunity(communityData);
			}
		} else if (navigation.state === "idle") {
			// Clear when navigation completes
			setPendingCommunity(null);
		}
	}, [navigation.state, navigation.location, communityData]);

	// If no event data at all (shouldn't happen), show error
	if (!event) {
		return (
			<main className="py-6 md:py-10">
				<div className="text-center">
					<p className="text-muted-foreground">Event not found</p>
				</div>
			</main>
		);
	}

	// Get user for TopNavigation
	const user = clientUserData?.user || (loaderData.userData instanceof Promise ? null : loaderData.userData?.user) || null;
	const userProfile = clientUserData?.userProfile || (loaderData.userData instanceof Promise ? null : loaderData.userData?.userProfile) || null;
	const topNavUser = userProfile ? {
		id: userProfile.id,
		avatar_url: userProfile.avatar_url,
		full_name: userProfile.full_name,
	} : null;

	// INSTANT NAVIGATION: userData is null, show skeleton for user-dependent parts
	if (loaderData.userData === null) {
		// Show event data immediately, skeleton for user data
		if (isLoadingUserData || !clientUserData) {
			return (
				<>
					{/* Show skeleton overlay when navigating to community */}
					{pendingCommunity && (
						<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
							<div className="min-h-screen container mx-auto px-4 sm:px-8 flex flex-col">
								<TopNavigation user={topNavUser} />
								<div className="lg:py-8 py-4 flex-1">
									<CommunityPageSkeleton
										community={{
											...pendingCommunity.community,
											memberCount: pendingCommunity.memberCount,
											eventCount: pendingCommunity.eventCount,
											description: pendingCommunity.description ?? undefined,
											verified: pendingCommunity.verified ?? false,
										} as Community & { memberCount?: number; eventCount?: number; description?: string; verified?: boolean }}
									/>
								</div>
							</div>
						</div>
					)}
					<EventPageSkeleton event={event} community={community} />
				</>
			);
		}
		// User data loaded, show full content
		return (
			<>
				{/* Show skeleton overlay when navigating to community */}
				{pendingCommunity && (
					<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
						<div className="min-h-screen container mx-auto px-4 sm:px-8 flex flex-col">
							<TopNavigation user={topNavUser} />
							<div className="lg:py-8 py-4 flex-1">
								<CommunityPageSkeleton
									community={{
										...pendingCommunity.community,
										memberCount: pendingCommunity.memberCount,
										eventCount: pendingCommunity.eventCount,
										description: pendingCommunity.description ?? undefined,
										verified: pendingCommunity.verified ?? false,
									} as Community & { memberCount?: number; eventCount?: number; description?: string; verified?: boolean }}
								/>
							</div>
						</div>
					</div>
				)}
				<EventPageContent
					event={event}
					community={community}
					userData={clientUserData}
					communityData={communityData}
					setPendingCommunity={setPendingCommunity}
				/>
			</>
		);
	}

	// NORMAL FLOW: userData is a Promise (server loaded), use Suspense
	return (
		<>
			{/* Show skeleton overlay when navigating to community */}
			{pendingCommunity && (
				<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
					<div className="min-h-screen container mx-auto px-4 sm:px-8 flex flex-col">
						<TopNavigation user={topNavUser} />
						<div className="lg:py-8 py-4 flex-1">
							<CommunityPageSkeleton
								community={{
									...pendingCommunity.community,
									memberCount: pendingCommunity.memberCount,
									eventCount: pendingCommunity.eventCount,
									description: pendingCommunity.description ?? undefined,
									verified: pendingCommunity.verified ?? false,
								} as Community & { memberCount?: number; eventCount?: number; description?: string; verified?: boolean }}
							/>
						</div>
					</div>
				</div>
			)}
			<Suspense fallback={<EventPageSkeleton event={event} community={community} />}>
				<Await resolve={loaderData.userData}>
					{(userData) => {
						const resolvedTopNavUser = userData?.userProfile ? {
							id: userData.userProfile.id,
							avatar_url: userData.userProfile.avatar_url,
							full_name: userData.userProfile.full_name,
						} : null;
						
						return (
							<>
								{/* Update topNavUser when userData resolves */}
								{pendingCommunity && (
									<div className="fixed inset-0 z-50 bg-background overflow-y-auto">
										<div className="min-h-screen container mx-auto px-4 sm:px-8 flex flex-col">
											<TopNavigation user={resolvedTopNavUser} />
											<div className="lg:py-8 py-4 flex-1">
												<CommunityPageSkeleton
													community={{
														...pendingCommunity.community,
														memberCount: pendingCommunity.memberCount,
														eventCount: pendingCommunity.eventCount,
														description: pendingCommunity.description ?? undefined,
														verified: pendingCommunity.verified ?? false,
													} as Community & { memberCount?: number; eventCount?: number; description?: string; verified?: boolean }}
												/>
											</div>
										</div>
									</div>
								)}
								<EventPageContent
									event={event}
									community={community}
									userData={userData}
									communityData={communityData}
									setPendingCommunity={setPendingCommunity}
								/>
							</>
						);
					}}
				</Await>
			</Suspense>
		</>
	);
}

// Main content component that receives resolved user data
function EventPageContent({
	event,
	community,
	userData,
	communityData,
	setPendingCommunity,
}: {
	event: Event;
	community: Community;
	userData: DeferredUserData;
	communityData: {
		community: Community;
		memberCount: number;
		eventCount: number;
		description?: string;
		verified?: boolean;
	} | null;
	setPendingCommunity: (data: {
		community: Community;
		memberCount: number;
		eventCount: number;
		description?: string;
		verified?: boolean;
	} | null) => void;
}) {
	const {
		registrationCount,
		isUserRegistered,
		userRegistrationStatus,
		canRegister,
		user,
		userProfile,
		isOwnerOrAdmin,
	} = userData;

	const actionData = useActionData<{
		success: boolean;
		error?: string;
		message?: string;
		needsCustomQuestions?: boolean;
		anonymousName?: string;
		anonymousEmail?: string;
	}>();
	const navigation = useNavigation();
	const submit = useSubmit();
	const [searchParams] = useSearchParams();
	const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
	const [showCustomQuestionsForm, setShowCustomQuestionsForm] = useState(false);
	const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
	const [anonymousName, setAnonymousName] = useState<string | null>(null);
	const [anonymousEmail, setAnonymousEmail] = useState<string | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<{
		days: number;
		hours: number;
		formatted: string;
	} | null>(null);

	// Check if form is submitting
	const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
	const submittingIntent = navigation.formData?.get("intent") as string | null;
	const isRegistering =
		isSubmitting &&
		(submittingIntent === "register" || submittingIntent === "anonymous-custom-questions");
	const isUnregistering =
		isSubmitting &&
		submittingIntent === "unregister";

	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time
		? dayjs(event.end_time).tz(event.timezone)
		: null;
	const isPastEvent = eventDate.isBefore(dayjs());
	const capacityPercentage = event.capacity
		? Math.round((registrationCount / event.capacity) * 100)
		: 0;

	// Format registration deadline for display
	const registrationDeadlineDate = event.registration_deadline
		? dayjs(event.registration_deadline).tz(event.timezone)
		: eventDate;
	const registrationDeadlineFormatted = registrationDeadlineDate.format("h:mm A z");

	// Calculate time remaining until registration deadline
	useEffect(() => {
		if (!event.registration_deadline) {
			setTimeRemaining(null);
			return;
		}

		const calculateTimeRemaining = () => {
			const remaining = getTimeRemaining(
				event.registration_deadline!,
				event.timezone
			);
			setTimeRemaining(remaining);
		};

		// Calculate immediately
		calculateTimeRemaining();

		// Update every minute
		const interval = setInterval(calculateTimeRemaining, 60000);

		return () => clearInterval(interval);
	}, [event.registration_deadline, event.timezone]);

	// Show toast notifications and handle custom questions flow
	useEffect(() => {
		if (actionData) {
			if (actionData.success && actionData.message) {
				toast.success(actionData.message);
				// Close subscribe dialog on successful subscription
				setShowSubscribeDialog(false);
			} else if (actionData.error) {
				toast.error(actionData.error);
			}

			// Handle anonymous registration with custom questions
			if (actionData.success && actionData.needsCustomQuestions) {
				setAnonymousName(actionData.anonymousName || null);
				setAnonymousEmail(actionData.anonymousEmail || null);
				setShowAnonymousDialog(false);
				setShowCustomQuestionsForm(true);
			}
		}
	}, [actionData]);

	// Check if event has custom questions
	const hasCustomQuestions = event.custom_questions && (
		(event.custom_questions as any)?.phone?.enabled ||
		((event.custom_questions as any)?.custom && (event.custom_questions as any).custom.length > 0)
	);

	// Check if this is an external event
	const isExternalEvent = event.registration_type === "external";
	const externalPlatform = event.external_platform as ExternalPlatform | null;
	const ExternalPlatformIcon = externalPlatform
		? getExternalPlatformIcon(externalPlatform)
		: ExternalLink;
	const externalPlatformName = externalPlatform
		? getExternalPlatformName(externalPlatform)
		: "External Form";

	// Get user phone from profile metadata
	const userPhone = userProfile?.metadata && typeof userProfile.metadata === 'object' && 'phone' in userProfile.metadata
		? (userProfile.metadata as any).phone
		: null;

	// Handle verification status from URL params
	useEffect(() => {
		const verified = searchParams.get("verified");
		if (verified === "success") {
			toast.success("Email verified! You're registered for the event.");
		} else if (verified === "already") {
			toast.info("You're already registered for this event.");
		} else if (verified === "pending_approval") {
			toast.success("Email verified! Your registration is pending approval.");
		}
	}, [searchParams]);

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: event.title,
					text: `Join ${event.title}`,
					url: window.location.href,
				});
			} catch (err) {
				console.error("Share failed:", err);
			}
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied to clipboard!");
		}
	};

	const handleCustomQuestionsSubmit = (answers: any) => {
		// Use React Router's submit to properly track navigation state
		const formData = new FormData();
		formData.append('intent', anonymousName ? 'anonymous-custom-questions' : 'register');
		formData.append('custom_answers', JSON.stringify(answers));

		if (anonymousName && anonymousEmail) {
			formData.append('name', anonymousName);
			formData.append('email', anonymousEmail);
		}

		submit(formData, { method: 'POST' });
	};

	return (
		<>
			<style>{`
				@keyframes bell-ring {
					0%, 100% { transform: rotate(0deg); }
					10% { transform: rotate(14deg); }
					20% { transform: rotate(-12deg); }
					30% { transform: rotate(10deg); }
					40% { transform: rotate(-8deg); }
					50% { transform: rotate(6deg); }
					60% { transform: rotate(-4deg); }
					70% { transform: rotate(2deg); }
					80% { transform: rotate(-1deg); }
					90% { transform: rotate(0deg); }
				}
			`}</style>
			<AnonymousRegistrationDialog
				open={showAnonymousDialog}
				onOpenChange={setShowAnonymousDialog}
				eventId={event.id}
				communitySlug={community.slug}
			/>
			<AnonymousSubscriptionDialog
				open={showSubscribeDialog}
				onOpenChange={setShowSubscribeDialog}
				eventId={event.id}
				communitySlug={community.slug}
			/>
			{hasCustomQuestions && (
				<CustomQuestionsForm
					open={showCustomQuestionsForm}
					onOpenChange={setShowCustomQuestionsForm}
					eventId={event.id}
					customQuestions={event.custom_questions as any}
					userName={userProfile?.full_name || undefined}
					userEmail={user?.email || undefined}
					userAvatarUrl={userProfile?.avatar_url || undefined}
					userPhone={userPhone}
					anonymousName={anonymousName || undefined}
					anonymousEmail={anonymousEmail || undefined}
					onSubmit={handleCustomQuestionsSubmit}
					isSubmitting={isSubmitting}
				/>
			)}
			<main className="py-6 md:py-10">
				<div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
						{/* Left Column: Cover + Host Info */}
						<div className="contents lg:block lg:space-y-6">
							{/* Event Cover - Mobile Order 1 */}
							<div className="order-1">
								{/* Event Cover - Square */}
								<div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden rounded-xl border shadow-sm">
									{/* Cover Image */}
									<Activity mode={event.cover_url ? "visible" : "hidden"}>
										<img
											src={event.cover_url || ""}
											alt={event.title}
											className="w-full h-full object-cover"
										/>
									</Activity>

									{/* Placeholder when no cover */}
									<Activity mode={!event.cover_url ? "visible" : "hidden"}>
										<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
											<Calendar className="h-16 w-16 text-primary/30" />
										</div>
									</Activity>

									{/* Past Event Overlay */}
									<Activity mode={isPastEvent ? "visible" : "hidden"}>
										<div className="absolute inset-0 bg-black/60 flex items-center justify-center">
											<Badge
												variant="outline"
												className="bg-black/60 text-white border-white/20"
											>
												Past Event
											</Badge>
										</div>
									</Activity>
								</div>
							</div>

							{/* Host Info, Capacity & Share - Mobile Order 3 */}
							<div className="order-3 space-y-6">
								{/* Host Info */}
								<div className="space-y-3">
									<div className="flex items-center justify-between border-b pb-2">
										<h3 className="text-sm font-semibold text-muted-foreground">
										Hosted By
									</h3>
									<Link
										to={`/c/${community.slug}`}
										state={communityData ? {
											community: communityData.community,
											memberCount: communityData.memberCount,
											eventCount: communityData.eventCount,
											description: communityData.description,
											verified: communityData.verified
										} : {
											community,
											description: community.description,
											verified: community.verified
										}}
										className="flex items-center gap-2 bg-card transition-colors"
										onClick={() => {
											// Set pending community immediately on click for instant feedback
											if (communityData) {
												setPendingCommunity(communityData);
											} else {
												setPendingCommunity({
													community,
													memberCount: 0,
													eventCount: 0,
													description: community.description || undefined,
													verified: community.verified || false,
												});
											}
										}}
									>
											<Avatar className="h-8 w-8">
											<AvatarImage
												src={community.logo_url || ""}
												alt={community.name}
											/>
											<AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
												{community.name?.substring(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm truncate hover:text-primary transition-colors">
												{community.name}
											</p>
										</div>
									</Link>
									</div>


									<Suspense fallback={<AttendersAvatarsSkeleton />}>
									<AttendersAvatars eventId={event.id} maxVisible={3} isExternalEvent={isExternalEvent} />
									</Suspense>


								{/* Capacity Indicator (only for native events) */}
								<Activity mode={!isExternalEvent && event.capacity && canRegister && !isPastEvent ? "visible" : "hidden"}>
										<div className="space-y-2 pt-3 lg:pt-6">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													{event.capacity
														? event.capacity - registrationCount
														: 0}{" "}
													spots left
												</span>
												<span className="font-semibold">
													{registrationCount}/{event.capacity || 0}
												</span>
											</div>
											<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full transition-all duration-300",
														capacityPercentage >= 90
															? "bg-red-500"
															: capacityPercentage >= 70
																? "bg-yellow-500"
																: "bg-primary"
													)}
													style={{
														width: `${Math.min(capacityPercentage, 100)}%`,
													}}
												/>
											</div>
										</div>
									</Activity>
								</div>

								{/* Contact & Share */}
								<div className="space-y-3">
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

									{/* Discussion Channel */}
									<Activity mode={event.discussion_link ? "visible" : "hidden"}>
										<div>
											{(() => {
												const platform = detectDiscussionPlatform(event.discussion_link || "");
												const PlatformIcon = getPlatformIcon(platform);
												const platformName = getPlatformName(platform);

												return (
													<Button
														asChild
														variant="outline"
														className="w-full"
														size="lg"
													>
														<a
															href={event.discussion_link || ""}
															target="_blank"
															rel="noopener noreferrer"
														>
															<PlatformIcon className="h-4 w-4 mr-2" />
															Join Event Chat on {platformName}
														</a>
													</Button>
												);
											})()}
										</div>
									</Activity>
								</div>
							</div>
						</div>

						{/* Right Column: Title + Content */}
						<div className="contents lg:block lg:space-y-6">
							{/* Event Title - Mobile Order 2 */}
							<div className="order-2">
								<h1 className="text-3xl md:text-4xl font-bold leading-tight">
									{event.title}
								</h1>
							</div>

							{/* Main Content - Mobile Order 4 */}
							<div className="order-4 space-y-6">
								{/* Date & Time */}
								<div className="flex items-start gap-3">
									<div className="mt-1">
										<Calendar className="h-5 w-5 text-muted-foreground" />
									</div>
									<div>
										<p className="font-semibold text-base">
											{eventDate.format("dddd, MMMM D")}
										</p>
										<p className="text-sm text-muted-foreground">
											{eventDate.format("h:mm A")}
											{eventEndDate &&
												` - ${eventEndDate.format("h:mm A")}`}{" "}
											{event.timezone}
										</p>
									</div>
								</div>

								{/* Location */}
								<Activity mode={event.location_address ? "visible" : "hidden"}>
									<div className="flex items-start gap-3">
										<div className="mt-1">
											<MapPin className="h-5 w-5 text-muted-foreground" />
										</div>
										<div>
											<p className="font-semibold text-base">
												{event.location_address?.split(",")[0] || ""}
											</p>
											<p className="text-sm text-muted-foreground">
												{event.location_address
													?.split(",")
													.slice(1)
													.join(",")
													.trim() || ""}
											</p>
										</div>
									</div>
								</Activity>

								<Separator />

								{/* Registration Section */}
								<div className="space-y-4">
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-semibold">
										{isOwnerOrAdmin ? "Event Management" : "Registration"}
									</h2>
									{isExternalEvent && (
										<Badge
											variant="outline"
											className="border-primary/50 bg-primary/5 text-primary"
										>
											<ExternalLink className="h-3 w-3 mr-1" />
											External
										</Badge>
									)}
								</div>

								<Card className="bg-card/50 shadow-none transition-all border-primary/20 hover:border-primary/40">
										<CardContent className="px-4 py-0 space-y-4">
											{/* Admin/Owner View */}
											<Activity mode={isOwnerOrAdmin ? "visible" : "hidden"}>
												<p className="text-sm text-muted-foreground">
													You are an admin of this community. Manage this event
													from the dashboard.
												</p>
												<div className="space-y-2">
													<Button asChild className="w-full bg-primary/80" size="lg">
														<Link to={`/dashboard/${community.slug}/events`}>
															<Settings className="h-4 w-4 mr-2" />
															Manage Event
														</Link>
													</Button>
												{!isExternalEvent && (
													<Button asChild variant="outline" className="w-full" size="lg">
														<Link to={`/dashboard/${community.slug}/attenders?eventId=${event.id}`}>
															<Users className="h-4 w-4 mr-2" />
															Check Attendance List
														</Link>
													</Button>
												)}
												{isExternalEvent && event.external_registration_url && (
													<Button asChild variant="outline" className="w-full" size="lg">
														<a
															href={event.external_registration_url}
															target="_blank"
															rel="noopener noreferrer"
														>
															<ExternalLink className="h-4 w-4 mr-2" />
															Open Registration Form
														</a>
													</Button>
												)}
											</div>
										</Activity>

										{/* External Event Subscribe View (for non-admin users) */}
										<Activity
											mode={
												!isOwnerOrAdmin && isExternalEvent && !isPastEvent
													? "visible"
													: "hidden"
											}
										>
											<div className="space-y-4">
												<div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
													<ExternalPlatformIcon
														className="h-6 w-6 flex-shrink-0 text-primary"
													/>
													<div>
														<p className="font-medium text-sm text-primary">
															Registration on {externalPlatformName}
														</p>
														<p className="text-xs text-primary/70">
															This event uses external registration
														</p>
													</div>
												</div>

												{registrationCount > 0 && (
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Bell className="h-4 w-4" />
														<span>
															{registrationCount} {registrationCount === 1 ? 'person' : 'people'} subscribed
														</span>
													</div>
												)}

												{/* Subscribe Section */}
												<div className="space-y-3">
													{isUserRegistered ? (
														<div className="flex items-center gap-2 text-green-600 dark:text-green-500">
															<CheckCircle2 className="h-5 w-5" />
															<span className="font-semibold">
																You're subscribed for updates!
															</span>
														</div>
													) : (
														<>
															{user ? (
																<Form method="post">
																	<input
																		type="hidden"
																		name="intent"
																		value="subscribe"
																	/>
																	<div className="relative w-full">
																		<span className="absolute inset-0 rounded-md border-2 border-primary animate-pulse" />
																		<Button
																			type="submit"
																			variant="outline"
																			className="relative w-full border-primary"
																			size="lg"
																			disabled={isSubmitting}
																		>
																			<Bell
																				className="h-4 w-4 mr-2 origin-top"
																				style={{
																					animation: 'bell-ring 1s ease-in-out infinite',
																				}}
																			/>
																			{isSubmitting ? "Subscribing..." : "Subscribe for Updates"}
																		</Button>
																	</div>
																</Form>
															) : (
																<div className="relative w-full">
																	<span className="absolute inset-0 rounded-md border-2 border-primary animate-pulse" />
																	<Button
																		type="button"
																		variant="outline"
																		className="relative w-full border-primary"
																		size="lg"
																		onClick={() => setShowSubscribeDialog(true)}
																	>
																		<Bell
																			className="h-4 w-4 mr-2 origin-top"
																			style={{
																				animation: 'bell-ring 1s ease-in-out infinite',
																			}}
																		/>
																		Subscribe for Updates
																	</Button>
																</div>
															)}
														</>
													)}
												</div>

												<Separator />

												{/* External Registration Link */}
												<div className="space-y-2">
													<p className="text-sm font-medium text-foreground">
														Complete your registration
													</p>
													<Button
														asChild
														className="w-full"
														size="lg"
													>
														<a
															href={event.external_registration_url || "#"}
															target="_blank"
															rel="noopener noreferrer"
														>
															Register on {externalPlatformName}
															<ExternalLink className="h-4 w-4 ml-2" />
														</a>
													</Button>
													<p className="text-xs text-center text-muted-foreground">
														You will be redirected to an external website to complete registration
													</p>
												</div>
											</div>
										</Activity>

										{/* External Event - Past Event View */}
										<Activity
											mode={
												!isOwnerOrAdmin && isExternalEvent && isPastEvent
													? "visible"
													: "hidden"
											}
										>
											<div className="flex flex-col items-center gap-3 py-4">
												<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
													<CalendarClock className="h-6 w-6 text-muted-foreground" />
												</div>
												<div className="text-center space-y-1">
													<p className="text-sm font-semibold text-foreground">
														This event has ended
													</p>
													<p className="text-xs text-muted-foreground">
														Thank you for your interest
													</p>
												</div>
											</div>
										</Activity>

										{/* Already Registered View (only for native events) */}
											<Activity
												mode={
												!isOwnerOrAdmin && !isExternalEvent && isUserRegistered
														? "visible"
														: "hidden"
												}
											>
												{userRegistrationStatus === "pending" ? (
													<div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900">
														<Hourglass className="h-5 w-5 flex-shrink-0" />
														<div>
															<p className="font-semibold text-sm">Registration Pending</p>
															<p className="text-xs opacity-90">Your request is waiting for approval.</p>
														</div>
													</div>
												) : userRegistrationStatus === "rejected" ? (
													<div className="flex items-center gap-2 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
														<AlertTriangle className="h-5 w-5 flex-shrink-0" />
														<div>
															<p className="font-semibold text-sm">Registration Rejected</p>
															<p className="text-xs opacity-90">Your registration request was declined.</p>
														</div>
													</div>
												) : (
															<div className="flex items-center gap-1 text-green-600 dark:text-green-500">
																<CheckCircle2 className="h-5 w-5" />
																<span className="font-semibold">
																	You're registered for this event!
																</span>
															</div>
												)}

												<Activity mode={event.capacity && canRegister && !isPastEvent && userRegistrationStatus === "approved" ? "visible" : "hidden"}>
													<div className="flex items-center justify-between text-sm pt-3 border-t">
														<span className="text-muted-foreground">
															Capacity
														</span>
														<span className="font-semibold">
															{registrationCount}/{event.capacity || 0}
														</span>
													</div>
												</Activity>

												<Form method="post" className="pt-2">
													<input
														type="hidden"
														name="intent"
														value="unregister"
													/>
													<Button
														type="submit"
														variant="outline"
														className="w-full"
														disabled={isUnregistering}
													>
														{isUnregistering ? "Cancelling..." : "Cancel Registration"}
													</Button>
												</Form>
											</Activity>

										{/* Can Register View (only for native events) */}
											<Activity
												mode={
												!isOwnerOrAdmin && !isExternalEvent && !isUserRegistered && canRegister
														? "visible"
														: "hidden"
												}
											>
												<Activity mode={!!timeRemaining ? "visible" : "hidden"}>
													<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
														<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
															<Hourglass className="h-4 w-4 text-primary" />
														</div>
														<div className="space-y-0.5">
															<p className="text-sm font-medium">
																Registration closes in{" "}
																<span className="text-primary font-bold">
																	{timeRemaining?.formatted}
																</span>
															</p>
															<p className="text-xs text-muted-foreground">
																Secure your spot before it’s too late!
															</p>
														</div>
													</div>
												</Activity>

												<Activity
													mode={
														!timeRemaining && event.registration_deadline
															? "visible"
															: "hidden"
													}
												>
													<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
														<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
															<CalendarClock className="h-4 w-4 text-muted-foreground" />
														</div>
														<div className="space-y-0.5">
															<p className="text-sm font-medium">
																Registration closes {registrationDeadlineFormatted}
															</p>
															<p className="text-xs text-muted-foreground">
																Don't miss out!
															</p>
														</div>
													</div>
												</Activity>

												<p className="text-sm text-foreground mb-4">
													Welcome! To join the event, please register below.
												</p>

												<Activity mode={user ? "visible" : "hidden"}>
													<div className="flex items-center gap-2">
														<Avatar className="h-6 w-6">
															<AvatarFallback className="bg-primary/10 text-primary text-xs">
																{userProfile?.full_name
																	? userProfile.full_name
																		.split(" ")
																		.map((n) => n[0])
																		.join("")
																		.toUpperCase()
																		.slice(0, 2)
																	: user?.email?.charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															{userProfile?.full_name ? (
																<>
																	<span className="text-sm font-semibold text-foreground">
																		{userProfile.full_name}
																	</span>
																	<span className="text-xs text-muted-foreground">
																		{user?.email}
																	</span>
																</>
															) : (
																<span className="text-sm text-muted-foreground">
																	{user?.email}
																</span>
															)}
														</div>
													</div>
												</Activity>

												<Activity mode={user ? "visible" : "hidden"}>
													{hasCustomQuestions ? (
														<Button
															type="button"
															onClick={() => setShowCustomQuestionsForm(true)}
															className="w-full"
															size="sm"
															disabled={isRegistering}
														>
															Register
														</Button>
													) : (
															<Form method="post">
																<input
																	type="hidden"
																	name="intent"
																	value="register"
																/>
																<Button
																	type="submit"
																	className="w-full"
																	size="sm"
																	disabled={isRegistering}
																>
																	{isRegistering ? "Registering..." : "Register"}
																</Button>
															</Form>
													)}
												</Activity>

												<Activity mode={!user ? "visible" : "hidden"}>
													<div className="space-y-3">
														<Button
															onClick={() => setShowAnonymousDialog(true)}
															className="w-full"
															size="lg"
															disabled={isSubmitting}
														>
															{isSubmitting ? "Processing..." : "Register for Event"}
														</Button>
														<p className="text-xs text-center text-muted-foreground">
															Already have an account?{" "}
															<Link
																to={`/login?redirect=/c/${community.slug}/events/${event.id}`}
																className="underline hover:text-foreground font-medium"
															>
																Login
															</Link>
														</p>
													</div>
												</Activity>
											</Activity>

										{/* Registration Closed View (only for native events) */}
											<Activity
												mode={
												!isOwnerOrAdmin && !isExternalEvent && !isUserRegistered && !canRegister
														? "visible"
														: "hidden"
												}
											>
												<div className="flex flex-col items-center gap-3 py-4">
													<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
														{isPastEvent ? (
															<CalendarClock className="h-6 w-6 text-muted-foreground" />
														) : event.capacity && registrationCount >= event.capacity ? (
															<PersonStanding className="h-6 w-6 text-muted-foreground" />
														) : (
															<Hourglass className="h-6 w-6 text-muted-foreground" />
														)}
													</div>
													<div className="text-center space-y-1">
														<p className="text-sm font-semibold text-foreground">
															{isPastEvent
																? "This event has ended"
																: event.capacity &&
																	registrationCount >= event.capacity
																	? "Event is at full capacity"
																	: "Registration is closed"}
														</p>
														<p className="text-xs text-muted-foreground">
															{isPastEvent
																? "Thank you for your interest"
																: event.capacity &&
																	registrationCount >= event.capacity
																	? "All spots have been filled"
																	: "The registration deadline has passed"}
														</p>
													</div>
												</div>
											</Activity>
										</CardContent>
									</Card>
								</div>

								{/* About Event */}
								<Activity mode={event.description ? "visible" : "hidden"}>
									<div className="space-y-4">
										<h2 className="text-xl font-semibold">About Event</h2>
										<div className="prose prose-sm max-w-none">
											<p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
												{event.description || ""}
											</p>
										</div>
									</div>
								</Activity>

								{/* Online Meeting */}
								<Activity
									mode={
										(event.event_type === "online" ||
											event.event_type === "hybrid") &&
											!!event.online_meeting_link
											? "visible"
											: "hidden"
									}
								>
									<div className="space-y-3 pt-4 border-t">
										<h3 className="text-base font-semibold flex items-center gap-2">
											<Video className="h-4 w-4" />
											Online Meeting
										</h3>

									{/* For external events, show meeting link to everyone */}
									<Activity mode={isExternalEvent || isUserRegistered ? "visible" : "hidden"}>
											<Button
												asChild
												variant="outline"
												className="w-full"
												size="sm"
											>
												<a
													href={event.online_meeting_link || ""}
													target="_blank"
													rel="noopener noreferrer"
												>
													Join Meeting
													<ExternalLink className="h-4 w-4 ml-2" />
												</a>
											</Button>
										</Activity>

									{/* For native events, show register prompt if not registered */}
									<Activity mode={!isExternalEvent && !isUserRegistered ? "visible" : "hidden"}>
											<p className="text-sm text-muted-foreground">
												Register to access the meeting link
											</p>
										</Activity>
									</div>
								</Activity>

						</div>
					</div>
				</div>
			</main>
		</>
	);
}
