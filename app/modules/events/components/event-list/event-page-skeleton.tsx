import { Activity } from "react";
import { Link } from "react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "~/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Separator } from "~/shared/components/ui/separator";
import { Card, CardContent } from "~/shared/components/ui/card";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { AttendersAvatarsSkeleton } from "~/modules/events/components/attenders/attender-avatars-skeleton";
import type { Community, Event } from "~/shared/models/entity.types";

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventPageSkeletonProps {
	event: Event;
	community?: Partial<Community>;
}

// Skeleton component shown while user data loads - displays event data immediately
export function EventPageSkeleton({ event, community }: EventPageSkeletonProps) {
	const eventDate = dayjs(event.start_time).tz(event.timezone);
	const eventEndDate = event.end_time
		? dayjs(event.end_time).tz(event.timezone)
		: null;
	const isPastEvent = eventDate.isBefore(dayjs());

	return (
		<main className="py-6 md:py-10">
			<div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
				{/* Left Column: Cover + Host Info */}
				<div className="contents lg:block lg:space-y-6">
					{/* Event Cover */}
					<div className="order-1">
						<div className="relative aspect-square w-full bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden rounded-xl border shadow-sm">
							<Activity mode={event.cover_url ? "visible" : "hidden"}>
								<img
									src={event.cover_url || ""}
									alt={event.title}
									className="w-full h-full object-cover"
								/>
							</Activity>
							<Activity mode={!event.cover_url ? "visible" : "hidden"}>
								<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
									<Calendar className="h-16 w-16 text-primary/30" />
								</div>
							</Activity>
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

					{/* Host Info - Loading State */}
					<div className="order-3 space-y-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between border-b pb-2">
								<h3 className="text-sm font-semibold text-muted-foreground">
									Hosted By
								</h3>
								{community?.name ? (
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
								) : (
									<div className="flex items-center gap-2">
										<Skeleton className="h-8 w-8 rounded-full" />
										<Skeleton className="h-4 w-24" />
									</div>
								)}
							</div>

							<AttendersAvatarsSkeleton />

							{/* Capacity Skeleton */}
							<Activity mode={event.capacity ? "visible" : "hidden"}>
								<div className="space-y-2 pt-3 lg:pt-6">
									<div className="flex items-center justify-between text-sm">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-4 w-12" />
									</div>
									<Skeleton className="w-full h-1.5 rounded-full" />
								</div>
							</Activity>
						</div>

						{/* Share Button Skeleton */}
						<div className="space-y-3">
							<Skeleton className="h-10 bg-muted w-full rounded-md" />
						</div>
					</div>
				</div>

				{/* Right Column: Title + Content */}
				<div className="contents lg:block lg:space-y-6">
					{/* Event Title */}
					<div className="order-2">
						<h1 className="text-3xl md:text-4xl font-bold leading-tight">
							{event.title}
						</h1>
					</div>

					{/* Main Content */}
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

						{/* Registration Section - Loading */}
						<div className="space-y-4">
							<h2 className="text-xl font-semibold">Registration</h2>
							<Card className="bg-card/50 shadow-none border-primary/20">
								<CardContent className="px-4 py-4 space-y-4">
									<Skeleton className="h-4 w-3/4 bg-muted" />
									<Skeleton className="h-10 w-full rounded-md bg-muted" />
									<Skeleton className="h-10 w-full rounded-md bg-muted" />
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
					</div>
				</div>
			</div>
		</main>
	);
}

export default EventPageSkeleton;

