import { useState, useEffect, Activity, Suspense, lazy } from "react";
import {
	useLoaderData,
	Link,
	Form,
	useActionData,
	useSearchParams,
	useNavigation,
} from "react-router";
import { redirect } from "react-router";
import { createClient } from "~/lib/supabase.server";
import type { Route } from "./+types/$slug.events.$eventId";
import type { Database } from "~/models/database.types";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
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
} from "~/lib/discussion-platform";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { cn, getTimeRemaining } from "~/lib/utils";
import crypto from "crypto";
import {
	sendVerificationEmail,
	sendRegistrationConfirmationEmail,
	sendRegistrationRequestEmail,
} from "~/lib/email.server";
import { AnonymousRegistrationDialog } from "~/components/events/anonymous-registration-dialog";
import { AttendersAvatarsSkeleton } from "~/components/events/attenders-avatars";

import CheckIcon3D from '~/assets/images/TickIcon.png'

// Lazy load the attenders avatars component
const AttendersAvatars = lazy(() =>
	import("~/components/events/attenders-avatars").then((module) => ({
		default: module.default,
	}))
);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

type Event = Database["public"]["Tables"]["events"]["Row"];
type Community = Database["public"]["Tables"]["communities"]["Row"];
type EventStatus = Database["public"]["Enums"]["event_status"];
type EventType = Database["public"]["Enums"]["event_type"];

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface LoaderData {
	event: Event;
	community: Community;
	registrationCount: number;
	isUserRegistered: boolean;
	userRegistrationStatus: string | null;
	canRegister: boolean;
	user: any;
	userProfile: Profile | null;
	isOwnerOrAdmin: boolean;
	origin: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const { supabase, headers } = createClient(request);

	const slug = params.slug;
	const eventId = params.eventId;

	if (!slug || !eventId) {
		throw new Response("Not Found", { status: 404 });
	}

	// Get community by slug
	const { data: community, error: communityError } = await supabase
		.from("communities")
		.select("*")
		.eq("slug", slug)
		.single();

	if (communityError || !community) {
		throw new Response("Community not found", { status: 404 });
	}

	// Get event by ID and verify it belongs to this community
	const { data: event, error: eventError } = await supabase
		.from("events")
		.select("*")
		.eq("id", eventId)
		.eq("community_id", community.id)
		.single();

	if (eventError || !event) {
		throw new Response("Event not found", { status: 404 });
	}

	// Only show published events to public
	if (event.status !== "published") {
		throw new Response("Event not available", { status: 404 });
	}

	// Get registration count (only approved registrations count towards capacity)
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
			.eq("community_id", community.id)
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

	// Get origin for absolute URLs in meta tags
	const url = new URL(request.url);
	const origin = url.origin;

	return {
		event,
		community,
		registrationCount: registrationCount || 0,
		isUserRegistered,
		userRegistrationStatus,
		canRegister,
		user: user || null,
		userProfile,
		isOwnerOrAdmin,
		origin,
	};
}

export async function action({ request, params }: Route.ActionArgs) {
	const { supabase } = createClient(request);
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	const slug = params.slug;
	const eventId = params.eventId;
	if (!eventId || !slug) {
		return { success: false, error: "Event ID and slug required" };
	}

	// Get event details
	const { data: event, error: eventError } = await supabase
		.from("events")
		.select("*")
		.eq("id", eventId)
		.single();

	if (eventError || !event) {
		console.error("Error fetching event:", eventError);
		return { success: false, error: "Event not found" };
	}

	// Get community details
	const { data: community, error: communityError } = await supabase
		.from("communities")
		.select("*")
		.eq("id", event.community_id)
		.single();

	if (communityError || !community) {
		console.error("Community not found for event:", eventId, communityError);
		return { success: false, error: "Community not found" };
	}

	// Handle anonymous registration
	if (intent === "anonymous-register") {
		console.log("Anonymous registration started");
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;

		if (!name || !email) {
			console.log("Missing name or email");
			return { success: false, error: "Name and email are required" };
		}

		console.log("Registering anonymous user:", { name, email, eventId });

		// Check if this email is already registered for this event
		const { data: existingRegistration, error: existingRegistrationError } =
			await supabase
				.from("event_registrations")
				.select("id, is_verified")
				.eq("event_id", eventId)
				.eq("anonymous_email", email)
				.maybeSingle();

		// Only return error if it's not a "no rows" error
		if (
			existingRegistrationError &&
			existingRegistrationError.code !== "PGRST116"
		) {
			console.error("Error checking registration:", existingRegistrationError);
			return {
				success: false,
				error: "Failed to check existing registration",
			};
		}

		if (existingRegistration) {
			if (existingRegistration.is_verified) {
				return {
					success: false,
					error: "This email is already registered for this event",
				};
			} else {
				return {
					success: false,
					error: "A verification email has already been sent to this address",
				};
			}
		}

		// Generate verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Determine approval status
		const approvalStatus = event.is_approve_required ? "pending" : "approved";

		// Create registration record
		console.log("Creating registration record...");
		const { error: registerError } = await supabase
			.from("event_registrations")
			.insert({
				event_id: eventId,
				anonymous_name: name,
				anonymous_email: email,
				rsvp_status: "going",
				is_verified: false,
				verification_token: verificationToken,
				token_expires_at: tokenExpiresAt.toISOString(),
				approval_status: approvalStatus,
			});

		if (registerError) {
			console.error("Error creating registration:", registerError);
			return { success: false, error: registerError.message };
		}

		console.log("Registration record created successfully");

		// Send verification email
		console.log("Sending verification email...");
		const verificationLink = `${new URL(request.url).origin
			}/c/${slug}/events/${eventId}/verify?token=${verificationToken}`;
		const registerAccountLink = `${new URL(request.url).origin}/signup`;

		try {
			await sendVerificationEmail({
				eventTitle: event.title,
				communityName: community.name,
				verificationLink,
				recipientName: name,
				recipientEmail: email,
				registerAccountLink,
			});
			console.log("Verification email sent successfully");
		} catch (error) {
			console.error("Failed to send verification email:", error);
			// Continue anyway - user can request resend
		}

		// Redirect to email sent page
		console.log("Redirecting to verification-sent page");
		return redirect(
			`/c/${slug}/events/${eventId}/verification-sent?email=${encodeURIComponent(
				email
			)}`
		);
	}

	// Check authentication for logged-in user actions
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return { success: false, error: "Please login to register for this event" };
	}

	if (intent === "register") {
		// Check if already registered
		const { data: existingRegistration } = await supabase
			.from("event_registrations")
			.select("id")
			.eq("event_id", eventId)
			.eq("user_id", user.id)
			.single();

		if (existingRegistration) {
			return {
				success: false,
				error: "You are already registered for this event",
			};
		}

		// Determine approval status
		const approvalStatus = event.is_approve_required ? "pending" : "approved";

		// Register user
		const { error: registerError } = await supabase
			.from("event_registrations")
			.insert({
				event_id: eventId,
				user_id: user.id,
				rsvp_status: "going",
				is_verified: true,
				approval_status: approvalStatus,
			});

		if (registerError) {
			return { success: false, error: registerError.message };
		}

		// Get user profile for email
		const { data: profile } = await supabase
			.from("profiles")
			.select("full_name")
			.eq("id", user.id)
			.single();

		const eventDate = dayjs(event.start_time).tz(event.timezone);
		const eventLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}`;

		// If pending approval, return early without sending confirmation email
		if (approvalStatus === "pending") {
			try {
				await sendRegistrationRequestEmail({
					eventTitle: event.title,
					communityName: community.name,
					eventLink,
					recipientName: profile?.full_name || "there",
					recipientEmail: user.email || "",
					eventDate: eventDate.format("dddd, MMMM D, YYYY"),
					eventTime: eventDate.format("h:mm A z"),
				});
			} catch (error) {
				console.error("Failed to send request email:", error);
			}
			return { success: true, message: "Registration request sent! Waiting for approval." };
		}

		// Send confirmation email
		const registerAccountLink = `${new URL(request.url).origin}/signup`;

		try {
			await sendRegistrationConfirmationEmail({
				eventTitle: event.title,
				communityName: community.name,
				eventDate: eventDate.format("dddd, MMMM D, YYYY"),
				eventTime: eventDate.format("h:mm A z"),
				eventLink,
				recipientName: profile?.full_name || "there",
				recipientEmail: user.email || "",
				registerAccountLink,
				locationAddress: event.location_address || undefined,
				onlineMeetingLink: event.online_meeting_link || undefined,
		  startTimeISO: event.start_time,
		  endTimeISO: event.end_time || event.start_time,
	  });
	} catch (error) {
		console.error("Failed to send confirmation email:", error);
		// Continue anyway - registration was successful
	}

		return { success: true, message: "Successfully registered for the event!" };
	}

	if (intent === "unregister") {
		const { error: unregisterError } = await supabase
			.from("event_registrations")
			.delete()
			.eq("event_id", eventId)
			.eq("user_id", user.id);

		if (unregisterError) {
			return { success: false, error: unregisterError.message };
		}

		return { success: true, message: "Registration cancelled" };
	}

	return { success: false, error: "Invalid action" };
}

export function meta({ data }: { data?: LoaderData }) {
	if (!data) {
		return [
			{ title: "Event Not Found" },
			{ name: "description", content: "Event not found" },
		];
	}

	const { event, community, origin } = data;
	const eventDate = dayjs(event.start_time).format("MMMM D, YYYY");

	// Construct canonical URL
	const canonicalUrl = `${origin}/c/${community.slug}/events/${event.id}`;

	// Ensure image URL is absolute
	const getAbsoluteImageUrl = (url: string | null | undefined): string => {
		if (!url) return "";
		// If already absolute, return as is
		if (url.startsWith("http://") || url.startsWith("https://")) {
			return url;
		}
		// If relative, make it absolute using origin
		if (url.startsWith("/")) {
			return `${origin}${url}`;
		}
		// Otherwise, assume it's a full Supabase URL (should already be absolute)
		return url;
	};

	// Get image URL with fallback priority: event cover > community logo > default
	let imageUrl = getAbsoluteImageUrl(event.cover_url || community.logo_url);

	// If no image is available, use a default Luhive image
	// Using the main domain logo as fallback (similar to hub.tsx)
	if (!imageUrl) {
		// Fallback to a publicly accessible logo
		// You can replace this with your actual hosted logo URL
		imageUrl = "https://luhive.com/LuhiveLogoBackground.png";
	}

	// Clean up Supabase storage URL - remove any query parameters that might interfere
	// and ensure it's a clean, accessible URL
	if (imageUrl) {
		try {
			const url = new URL(imageUrl);
			// Remove any transform or query parameters that might cause issues
			url.search = "";
			imageUrl = url.toString();

			// Ensure Supabase storage URLs use HTTPS (required for og:image)
			if (imageUrl.includes('supabase.co') && !imageUrl.startsWith('https://')) {
				imageUrl = imageUrl.replace(/^http:\/\//, 'https://');
			}
		} catch (e) {
			// If URL parsing fails, use as-is
			console.warn("Failed to parse image URL:", imageUrl);
		}
	}

	const metaTags: Array<
		| { title: string }
		| { name: string; content: string }
		| { property: string; content: string }
		| { tagName: string; rel: string; href: string }
	> = [
		{ title: `${event.title} - ${community.name}` },
		{
			name: "description",
			content:
				event.description ||
				`Join ${event.title} hosted by ${community.name} on ${eventDate}`,
		},
		{ property: "og:title", content: `${event.title} - ${community.name}` },
		{
			property: "og:description",
			content: event.description || `Join ${event.title}`,
			},
			{ property: "og:type", content: "event" },
			{ property: "og:url", content: canonicalUrl },
			{ property: "og:site_name", content: "Luhive" },
		];

	// Add image meta tags only if we have a valid image URL
	if (imageUrl) {
		// Detect image type from URL extension
		const getImageType = (url: string): string => {
			const lowerUrl = url.toLowerCase();
			if (lowerUrl.includes('.png')) return 'image/png';
			if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
			if (lowerUrl.includes('.webp')) return 'image/webp';
			return 'image/jpeg'; // Default to JPEG
		};

		const imageType = getImageType(imageUrl);

		metaTags.push(
			{ property: "og:image", content: imageUrl },
			{ property: "og:image:secure_url", content: imageUrl },
			{ property: "og:image:type", content: imageType },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:image:alt", content: `${event.title} - ${community.name}` }
		);
	}

	// Twitter Card meta tags
	metaTags.push(
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: `${event.title} - ${community.name}` },
		{
			name: "twitter:description",
			content: event.description || `Join ${event.title}`,
		}
	);

	if (imageUrl) {
		metaTags.push({ name: "twitter:image", content: imageUrl });
	}

	metaTags.push({ tagName: "link", rel: "canonical", href: canonicalUrl });

	return metaTags;
}

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
	const {
		event,
		community,
		registrationCount,
		isUserRegistered,
		userRegistrationStatus,
		canRegister,
		user,
		userProfile,
		isOwnerOrAdmin,
	} = useLoaderData<LoaderData>();
	const actionData = useActionData<{
		success: boolean;
		error?: string;
		message?: string;
	}>();
	const navigation = useNavigation();
	const [searchParams] = useSearchParams();
	const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<{
		days: number;
		hours: number;
		formatted: string;
	} | null>(null);

	// Check if form is submitting
	const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
	const isRegistering =
		isSubmitting &&
		navigation.formData?.get("intent") === "register";
	const isUnregistering =
		isSubmitting &&
		navigation.formData?.get("intent") === "unregister";

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

	return (
		<div className="min-h-screen bg-background">
			<AnonymousRegistrationDialog
				open={showAnonymousDialog}
				onOpenChange={setShowAnonymousDialog}
				eventId={event.id}
				communitySlug={community.slug}
			/>
			<main className="w-full">
				{/* Content Container */}
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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
										className="flex items-center gap-2 bg-card transition-colors"
									>
											<Avatar className="h-8 w-8">
											<AvatarImage
												src={community.logo_url || ""}
												alt={community.name}
											/>
											<AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
												{community.name.substring(0, 2).toUpperCase()}
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
										<AttendersAvatars eventId={event.id} maxVisible={3} />
									</Suspense>


									{/* Capacity Indicator */}
									<Activity mode={event.capacity && canRegister && !isPastEvent ? "visible" : "hidden"}>
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
									<h2 className="text-xl font-semibold">
										{isOwnerOrAdmin ? "Event Management" : "Registration"}
									</h2>

									<Card className="bg-card/50 shadow-none border-primary/20 hover:border-primary/40 transition-all">
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
													<Button asChild variant="outline" className="w-full" size="lg">
														<Link to={`/dashboard/${community.slug}/attenders?eventId=${event.id}`}>
															<Users className="h-4 w-4 mr-2" />
															Check Attendance List
														</Link>
													</Button>
												</div>
											</Activity>

											{/* Already Registered View */}
											<Activity
												mode={
													!isOwnerOrAdmin && isUserRegistered
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

											{/* Can Register View */}
											<Activity
												mode={
													!isOwnerOrAdmin && !isUserRegistered && canRegister
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

											{/* Registration Closed View */}
											<Activity
												mode={
													!isOwnerOrAdmin && !isUserRegistered && !canRegister
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

										<Activity mode={isUserRegistered ? "visible" : "hidden"}>
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

										<Activity mode={!isUserRegistered ? "visible" : "hidden"}>
											<p className="text-sm text-muted-foreground">
												Register to access the meeting link
											</p>
										</Activity>
									</div>
								</Activity>

							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
