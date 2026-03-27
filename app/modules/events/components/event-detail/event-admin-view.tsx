import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { Link } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { CalendarDays, Edit3, Eye, MapPin, QrCode, Share2, Users } from "lucide-react";
import { createClient } from "~/shared/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent } from "~/shared/components/ui/card";
import { Badge } from "~/shared/components/ui/badge";
import { Skeleton } from "~/shared/components/ui/skeleton";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "~/shared/components/ui/chart";
import { cn } from "~/shared/lib/utils";
import {
	EventAdminStatisticsPanel,
	type EventAdminBreakdownRow,
	type EventAdminChartPoint,
	type EventAdminTimeRange,
} from "./event-admin-statistics-panel";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";
import { getEventStatisticsPayloadClient } from "~/modules/events/data/event-statistics-repo.client";
import type { Community, Event } from "~/shared/models/entity.types";
import type { UserData } from "~/modules/events/server/event-detail-loader.server";

dayjs.extend(timezone);

const mobileChartConfig = {
	views: {
		label: "Views",
		color: "#f97316",
	},
	attendees: {
		label: "Attendees",
		color: "#fb923c",
	},
} satisfies ChartConfig;

type EventAttendeeRow = {
	id: string;
	name: string;
	avatarUrl: string | null;
	status: "pending" | "going" | "rejected";
	registeredAt: string | null;
};

interface EventAdminViewProps {
	event: Event;
	community: Community;
	userData: UserData;
	hostingCommunities: Array<{
		id: string;
		name: string;
		slug: string;
		logo_url: string | null;
		role: "host" | "co-host";
		isMember?: boolean;
	}>;
	isExternalEvent: boolean;
	onShare: () => void;
}

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function toDayKey(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getDays(range: EventAdminTimeRange): number {
	if (range === "1d") return 1;
	if (range === "3d") return 3;
	if (range === "7d") return 7;
	if (range === "30d") return 30;
	if (range === "90d") return 90;
	return 30;
}

function inRange(isoDate: string | null | undefined, startDate: Date): boolean {
	if (!isoDate) return false;
	const normalized = isoDate.includes(" ") ? isoDate.replace(" ", "T") : isoDate;
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) return false;
	return date.getTime() >= startDate.getTime();
}

function buildChartData(
	range: EventAdminTimeRange,
	visits: Array<{ visited_at: string }>,
	attendeeRegistrations: Array<{ registered_at: string }>,
): EventAdminChartPoint[] {
	const days = getDays(range);
	const today = startOfDay(new Date());

	const buckets = Array.from({ length: days }, (_, idx) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (days - idx - 1));
		return {
			key: toDayKey(date),
			label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
			views: 0,
			attendees: 0,
		};
	});

	const map = new Map(buckets.map((b) => [b.key, b]));

	visits.forEach((row) => {
		const normalized = row.visited_at.includes(" ")
			? row.visited_at.replace(" ", "T")
			: row.visited_at;
		const date = new Date(normalized);
		if (Number.isNaN(date.getTime())) {
			// Fallback: keep invalid timestamps visible in chart instead of dropping all points.
			const lastBucket = buckets[buckets.length - 1];
			if (lastBucket) lastBucket.views += 1;
			return;
		}
		const key = toDayKey(startOfDay(date));
		const bucket = map.get(key);
		if (bucket) bucket.views += 1;
	});

	attendeeRegistrations.forEach((row) => {
		const normalized = row.registered_at.includes(" ")
			? row.registered_at.replace(" ", "T")
			: row.registered_at;
		const date = new Date(normalized);
		if (Number.isNaN(date.getTime())) {
			const lastBucket = buckets[buckets.length - 1];
			if (lastBucket) lastBucket.attendees += 1;
			return;
		}
		const key = toDayKey(startOfDay(date));
		const bucket = map.get(key);
		if (bucket) bucket.attendees += 1;
	});

	return buckets;
}

function buildBreakdown(rows: string[], fallbackLabel: string): EventAdminBreakdownRow[] {
	const counts = rows.reduce<Record<string, number>>((acc, label) => {
		const value = label.trim().length > 0 ? label : fallbackLabel;
		acc[value] = (acc[value] || 0) + 1;
		return acc;
	}, {});

	return Object.entries(counts)
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 8);
}

function HostIdentity({ community }: { community: Community }) {
	return (
		<div className="flex items-center gap-2 px-1 py-1">
			<Avatar className="h-7 w-7">
				<AvatarImage src={community.logo_url || undefined} alt={community.name} />
				<AvatarFallback>{community.name.slice(0, 1).toUpperCase()}</AvatarFallback>
			</Avatar>
			<p className="text-sm font-medium">{community.name}</p>
		</div>
	);
}

export function EventAdminView({
	event,
	community,
	userData,
	hostingCommunities,
	isExternalEvent,
	onShare,
}: EventAdminViewProps) {
	type AdminTab = "overview" | "attendees" | "analytics";

	const [range, setRange] = useState<EventAdminTimeRange>("7d");
	const [activeTab, setActiveTab] = useState<AdminTab>("overview");
	const [loading, setLoading] = useState(true);
	const [attendees, setAttendees] = useState<EventAttendeeRow[]>([]);
	const [visits, setVisits] = useState<
		Array<{ visited_at: string; session_id: string; utm_source: string | null; country: string | null }>
	>([]);
	const [expandedDescription, setExpandedDescription] = useState(false);

	useEffect(() => {
		let active = true;

		const loadAdminData = async () => {
			setLoading(true);
			try {
				const supabase = createClient();

				const [statsResult, registrationsResult] = await Promise.all([
					getEventStatisticsPayloadClient(event.id, community.id),
					supabase
						.from("event_registrations")
						.select(
							`id, anonymous_name, user_id, registered_at, rsvp_status, approval_status, profiles ( full_name, avatar_url )`,
						)
						.eq("event_id", event.id)
						.order("registered_at", { ascending: false }),
				]);

				if (!active) return;

				if (!statsResult.error && statsResult.payload) {
					setVisits(
						(statsResult.payload.visits || []).map((row) => ({
							visited_at: row.visited_at,
							session_id: row.session_id,
							utm_source: row.utm_source,
							country: row.country,
						})),
					);
				} else {
					setVisits([]);
				}

				if (registrationsResult.error) {
					setAttendees([]);
				} else {
					const mapped = (registrationsResult.data || []).map((row: any) => {
						const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
						const status = row.approval_status === "pending"
							? "pending"
							: row.approval_status === "rejected"
								? "rejected"
								: "going";

						return {
							id: row.id,
							name: row.anonymous_name || profile?.full_name || "Anonymous",
							avatarUrl: profile?.avatar_url || null,
							status,
							registeredAt: row.registered_at,
						} satisfies EventAttendeeRow;
					});

					setAttendees(mapped);
				}
			} catch {
				if (active) {
					setAttendees([]);
					setVisits([]);
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		loadAdminData();
		return () => {
			active = false;
		};
	}, [community.id, event.id]);

	const rangeStart = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() - (getDays(range) - 1));
		return startOfDay(d);
	}, [range]);

	const filteredVisits = useMemo(
		() => visits.filter((row) => inRange(row.visited_at, rangeStart)),
		[rangeStart, visits],
	);

	const filteredAttendeeRegistrations = useMemo(
		() =>
			attendees
				.filter((row) => row.status === "going" && !!row.registeredAt && inRange(row.registeredAt, rangeStart))
				.map((row) => ({ registered_at: row.registeredAt as string })),
		[attendees, rangeStart],
	);

	const chartData = useMemo(
		() => buildChartData(range, filteredVisits, filteredAttendeeRegistrations),
		[filteredAttendeeRegistrations, filteredVisits, range],
	);

	const sourceBreakdown = useMemo(
		() =>
			buildBreakdown(
				filteredVisits.map((row) => normalizeUtmSource(row.utm_source)),
				"direct",
			),
		[filteredVisits],
	);

	const countryBreakdown = useMemo(
		() => buildBreakdown(filteredVisits.map((row) => row.country || "unknown"), "unknown"),
		[filteredVisits],
	);

	const mobileSourceRows = useMemo(() => {
		const total = sourceBreakdown.reduce((sum, row) => sum + row.count, 0);
		return sourceBreakdown.slice(0, 4).map((row) => ({
			...row,
			percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
		}));
	}, [sourceBreakdown]);

	const mobileCountryRows = useMemo(() => {
		const total = countryBreakdown.reduce((sum, row) => sum + row.count, 0);
		return countryBreakdown.slice(0, 4).map((row) => ({
			...row,
			percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
		}));
	}, [countryBreakdown]);

	const pendingAttendees = useMemo(
		() => attendees.filter((row) => row.status === "pending"),
		[attendees],
	);

	const goingAttendees = useMemo(
		() => attendees.filter((row) => row.status === "going"),
		[attendees],
	);

	const hostCommunity = hostingCommunities.find((item) => item.role === "host");
	const displayCommunity = hostCommunity
		? { ...community, name: hostCommunity.name, logo_url: hostCommunity.logo_url }
		: community;

	const descriptionCharLimit = 590;
	const descriptionText = event.description || "No description provided yet.";
	const isTruncated = descriptionText.length > descriptionCharLimit;
	const displayedDescription = expandedDescription 
		? descriptionText 
		: descriptionText.slice(0, descriptionCharLimit) + (isTruncated ? "..." : "");

	const eventDate = dayjs(event.start_time).tz(event.timezone || "UTC");
	const eventTimeLabel = `${eventDate.format("dddd, MMMM D")} • ${eventDate.format("h:mm A")}${
		event.timezone ? ` (${event.timezone})` : ""
	}`;
	const editPath = isExternalEvent
		? `/dashboard/${community.slug}/events/${event.id}/edit-external`
		: `/dashboard/${community.slug}/events/${event.id}/edit`;

	return (
		<div>
			<div className="md:hidden rounded-2xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
				<div className="flex items-center justify-between gap-2">
					<HostIdentity community={displayCommunity as Community} />
					{activeTab === "overview" && (
						<div className="flex items-center gap-2">
							<Button
								asChild
								size="sm"
								variant="ghost"
								className="h-8 rounded-lg px-3 text-xs border border-[#E6E6E6] bg-[#ffffff] text-black shadow-none hover:bg-[#ffffff] hover:text-black"
							>
								<Link to={editPath}>
									<Edit3 className="mr-1.5 h-3.5 w-3.5" />
									Edit
								</Link>
							</Button>
							<Button
								asChild
								size="sm"
								variant="ghost"
								className="h-8 rounded-lg px-3 text-xs border border-[#E6E6E6] bg-[#ffffff] text-black shadow-none hover:bg-[#ffffff] hover:text-black"
							>
								<Link to={`/dashboard/${community.slug}/events/${event.id}/statistics`}>
									<Eye className="mr-1.5 h-3.5 w-3.5" />
									Preview
								</Link>
							</Button>
						</div>
					)}
				</div>

				<div className="mt-4 border-b border-[#E9E9E9]">
					<div className="grid grid-cols-3 gap-4">
						{(["overview", "attendees", "analytics"] as AdminTab[]).map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => setActiveTab(tab)}
								className={cn(
									"border-b-2 pb-2 text-center text-[15px] font-semibold capitalize transition-colors",
									activeTab === tab
										? "border-[#FF7A1A] text-[#FF7A1A]"
										: "border-transparent text-[#444444]",
								)}
							>
								{tab}
							</button>
						))}
					</div>
				</div>

				{activeTab === "overview" && (
					<div className="pt-4 space-y-5">
						<div className="flex gap-3">
							<div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
								{event.cover_url ? (
									<img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" />
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground">
										<Users className="h-5 w-5" />
									</div>
								)}
							</div>
							<div className="space-y-2">
								<h1 className="text-[18px] font-semibold leading-[1.05] text-[#2A2A2A]">{event.title}</h1>
								<p className="flex items-start gap-2 text-xs text-[#7A7A7A]">
									<CalendarDays className="mt-0.5 h-4 w-4" />
									<span>{eventTimeLabel}</span>
								</p>
								{event.location_address && (
									<p className="flex items-center gap-2 text-xs text-[#7A7A7A]">
										<MapPin className="h-4 w-4" />
										{event.location_address}
									</p>
								)}
							</div>
						</div>

						<div className="rounded-2xl border border-[#E6E6E6] bg-[#ffffff] p-4">
							<div className="flex items-start justify-between">
								<p className="text-[30px] font-semibold leading-none text-[#2A2A2A]">{goingAttendees.length}</p>
								{pendingAttendees.length > 0 && (
									<p className="rounded-full border border-[#FF7A1A] px-2 py-0.5 text-[12px] font-semibold text-[#FF7A1A]">
										+{pendingAttendees.length} new
									</p>
								)}
							</div>
							<p className="mt-2 text-sm text-[#666666]">registered for this event</p>
						</div>

						<div className="space-y-2">
							<p className="text-[24px] font-medium text-[#2A2A2A]">About event</p>
							<p className="whitespace-pre-wrap text-[15px] leading-7 text-[#4A4A4A]">{displayedDescription}</p>
							{isTruncated && (
								<button
									type="button"
									onClick={() => setExpandedDescription(!expandedDescription)}
									className="text-[15px] font-semibold text-[#2A2A2A]"
								>
									{expandedDescription ? "Read less" : "Read more"}
								</button>
							)}
						</div>
					</div>
				)}

				{activeTab === "attendees" && (
					<div className="pt-4 space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-end gap-1">
								<p className="text-[44px] font-semibold leading-none text-[#2A2A2A]">{goingAttendees.length}</p>
								<p className="pb-1 text-[28px] font-semibold leading-none text-[#2A2A2A]">going</p>
							</div>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="h-9 rounded-lg border border-[#E6E6E6] bg-[#ffffff] px-3 text-[13px] text-[#444444] hover:bg-[#ffffff]"
							>
								<Link to={`/dashboard/${community.slug}/attenders?eventId=${event.id}`}>Details</Link>
							</Button>
						</div>

						<div className="space-y-2">
							<p className="text-[15px] font-semibold text-[#F59E0B]">Pending ({pendingAttendees.length})</p>
							{pendingAttendees.length === 0 ? (
								<p className="text-sm text-[#7A7A7A]">No pending attendees.</p>
							) : (
								pendingAttendees.slice(0, 1).map((attendee) => (
									<div key={attendee.id} className="flex items-center justify-between">
										<p className="text-[18px] font-medium text-[#2A2A2A]">{attendee.name}</p>
										<div className="flex items-center gap-3">
											<button
												type="button"
												className="rounded-xl bg-[#08A820] px-4 py-2 text-sm font-semibold text-white"
											>
												Accept
											</button>
											<button type="button" className="text-sm font-semibold text-[#EF4444]">
												Deny
											</button>
										</div>
									</div>
								))
							)}
						</div>

						<div className="space-y-3">
							<p className="text-[15px] font-semibold text-[#22A54E]">Going ({goingAttendees.length})</p>
							{goingAttendees.length === 0 ? (
								<p className="text-sm text-[#7A7A7A]">No approved attendees yet.</p>
							) : (
								goingAttendees.slice(0, 6).map((attendee) => (
									<div key={attendee.id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9">
												<AvatarImage src={attendee.avatarUrl || undefined} alt={attendee.name} />
												<AvatarFallback>{attendee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
											</Avatar>
											<p className="text-[18px] font-medium text-[#2A2A2A]">{attendee.name}</p>
										</div>
										<Badge
											variant="outline"
											className="rounded-full border-[#69C06F] bg-[#EDF9EE] px-3 py-0.5 text-[18px] font-semibold text-[#2D8E35]"
										>
											Going
										</Badge>
									</div>
								))
							)}
						</div>

						<div className="flex justify-end pt-10">
							<Button className="h-11 rounded-xl bg-[#FF7A1A] px-4 text-sm font-semibold text-white hover:bg-[#FF7A1A]">
								<QrCode className="mr-2 h-4 w-4" />
								QR Scan
							</Button>
						</div>
					</div>
				)}

				{activeTab === "analytics" && (
					<div className="pt-4 space-y-3">
						<div className="rounded-2xl border border-[#E6E6E6] bg-[#ffffff] p-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-[44px] font-semibold leading-none text-[#2A2A2A]">{filteredVisits.length}</p>
									<p className="mt-1 text-sm text-[#666666]">total views</p>
								</div>
								<select
									value={range}
									onChange={(e) => setRange(e.target.value as EventAdminTimeRange)}
									className="h-9 rounded-lg border border-[#E6E6E6] bg-[#ffffff] px-3 text-sm font-semibold text-[#444444]"
								>
									<option value="7d">Last 7 days</option>
									<option value="30d">Last 30 days</option>
									<option value="90d">Last 3 months</option>
								</select>
							</div>
							<div className="mt-3">
								<ChartContainer config={mobileChartConfig} className="h-28 w-full" id="event-admin-mobile-chart">
									<AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
										<defs>
											<linearGradient id="fillMobileViews" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
												<stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
											</linearGradient>
											<linearGradient id="fillMobileAttendees" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
												<stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
											</linearGradient>
										</defs>
										<CartesianGrid vertical={false} stroke="#EEEEEE" />
										<XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Area
											type="monotone"
											dataKey="views"
											stroke="#f97316"
											strokeWidth={2}
											fill="url(#fillMobileViews)"
											dot={false}
										/>
										<Area
											type="monotone"
											dataKey="attendees"
											stroke="#fb923c"
											strokeWidth={1.5}
											fill="url(#fillMobileAttendees)"
											dot={false}
										/>
									</AreaChart>
								</ChartContainer>
							</div>
						</div>

						<div className="rounded-2xl border border-[#E6E6E6] bg-[#ffffff] p-4">
							<p className="font-manrope font-bold text-[18px] leading-[150%] tracking-normal">View Sources</p>
							<div className="mt-3 space-y-2">
								{mobileSourceRows.length === 0 ? (
									<p className="text-sm text-[#7A7A7A]">No source data yet.</p>
								) : (
									mobileSourceRows.map((row) => (
										<div key={row.label} className="flex items-center justify-between">
											<p className="font-manrope font-semibold text-[12px] leading-[150%] tracking-normal">{row.label}</p>
											<p className="font-manrope font-semibold text-[12px] leading-[150%] tracking-normal">{row.percent}%</p>
										</div>
									))
								)}
							</div>
						</div>

						<div className="rounded-2xl border border-[#E6E6E6] bg-[#ffffff] p-4">
							<p className="font-manrope font-bold text-[18px] leading-[150%] tracking-normal">Top Countries</p>
							<div className="mt-3 space-y-2">
								{mobileCountryRows.length === 0 ? (
									<p className="text-sm text-[#7A7A7A]">No country data yet.</p>
								) : (
									mobileCountryRows.map((row) => (
										<div key={row.label} className="flex items-center justify-between">
											<p className="font-manrope font-semibold text-[12px] leading-[150%] tracking-normal">{row.label}</p>
											<p className="font-manrope font-semibold text-[12px] leading-[150%] tracking-normal">{row.percent}%</p>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="hidden md:block">
				{activeTab === "overview" && (
					<div className="space-y-4 pt-2">
						<div className="grid gap-4 xl:grid-cols-[480px_1fr]">
							<Card className="bg-[#FAFAFA] border-none shadow-none">
								<CardContent className="space-y-4 p-4">
									<div className="flex items-center justify-between gap-2">
										<HostIdentity community={displayCommunity as Community} />
										<div className="flex items-center gap-1">
											<Button
												asChild
												size="sm"
												variant="ghost"
												className="h-7 px-2 text-xs border border-[#E6E6E6] bg-[#ffffff] text-black shadow-none hover:bg-[#ffffff] hover:text-black"
											>
												<Link to={editPath}>
													<Edit3 className="mr-1.5 h-3.5 w-3.5" />
													Edit
												</Link>
											</Button>
											<Button
												asChild
												size="sm"
												variant="ghost"
												className="h-7 px-2 text-xs border border-[#E6E6E6] bg-[#ffffff] text-black shadow-none hover:bg-[#ffffff] hover:text-black"
											>
												<Link to={`/dashboard/${community.slug}/events/${event.id}/statistics`}>
													<Eye className="mr-1.5 h-3.5 w-3.5" />
													Preview
												</Link>
											</Button>
											<Button
												onClick={onShare}
												size="sm"
												variant="ghost"
												className="h-7 px-2 text-xs border border-[#E6E6E6] bg-[#ffffff] text-black shadow-none hover:bg-[#ffffff] hover:text-black"
											>
												<Share2 className="mr-1.5 h-3.5 w-3.5" />
												Share
											</Button>
										</div>
									</div>

									<div className="flex gap-3">
										<div className="h-28 w-24 overflow-hidden rounded-lg border border-border/60 bg-muted">
											{event.cover_url ? (
												<img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" />
											) : (
												<div className="flex h-full w-full items-center justify-center text-muted-foreground">
													<Users className="h-6 w-6" />
												</div>
											)}
										</div>
										<div className="space-y-2">
											<h1 className="font-manrope font-bold text-[24px] leading-normal tracking-normal align-middle">{event.title}</h1>
											<p className="flex items-center gap-2 text-xs text-muted-foreground">
												<CalendarDays className="h-4 w-4" />
												{eventTimeLabel}
											</p>
											{event.location_address && (
												<p className="flex items-center gap-2 text-xs text-muted-foreground">
													<MapPin className="h-4 w-4" />
													{event.location_address}
												</p>
											)}
										</div>
									</div>

									<div className="space-y-2">
										<p className="text-[24px] font-medium">About Event</p>
										<p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
											{displayedDescription}
										</p>
										{isTruncated && (
											<button
												onClick={() => setExpandedDescription(!expandedDescription)}
												className="text-sm font-medium text-primary hover:underline mt-2"
											>
												{expandedDescription ? "Read Less" : "Read More"}
											</button>
										)}
									</div>
								</CardContent>
							</Card>

							{loading ? (
								<div className="space-y-3">
									<Skeleton className="h-28 w-full" />
									<Skeleton className="h-48 w-full" />
								</div>
							) : (
								<EventAdminStatisticsPanel
									range={range}
									onRangeChange={setRange}
									attendeesCount={goingAttendees.length}
									pendingCount={pendingAttendees.length}
									totalViews={filteredVisits.length}
									chartData={chartData}
									sourceBreakdown={sourceBreakdown}
									countryBreakdown={countryBreakdown}
									layout="overview"
									compact
								/>
							)}
						</div>
					</div>
				)}

				{activeTab === "attendees" && (
					<div className="pt-2">
						<div className="grid gap-4 lg:grid-cols-[300px_1fr]">
							<Card className="border-border/60">
								<CardContent className="space-y-4 p-4">
									<div>
										<p className="text-sm text-muted-foreground">Total Going</p>
										<p className="text-4xl font-semibold tabular-nums">{goingAttendees.length}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Pending</p>
										<p className="text-2xl font-semibold text-amber-600 tabular-nums">
											{pendingAttendees.length}
										</p>
									</div>
									<Button asChild className="w-full" variant="outline" size="sm">
										<Link to={`/dashboard/${community.slug}/attenders?eventId=${event.id}`}>
											Open Full Attendees
										</Link>
									</Button>
								</CardContent>
							</Card>

							<Card className="border-border/60">
								<CardContent className="p-4">
									{loading ? (
										<div className="space-y-3">
											<Skeleton className="h-12 w-full" />
											<Skeleton className="h-12 w-full" />
											<Skeleton className="h-12 w-full" />
										</div>
									) : attendees.length === 0 ? (
										<p className="text-sm text-muted-foreground">No attendees yet.</p>
									) : (
										<div className="space-y-2">
											{attendees.slice(0, 14).map((attendee) => (
												<div
													key={attendee.id}
													className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
												>
													<div className="flex items-center gap-3">
														<Avatar className="h-8 w-8">
															<AvatarImage src={attendee.avatarUrl || undefined} alt={attendee.name} />
															<AvatarFallback>{attendee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
														</Avatar>
														<div>
															<p className="text-sm font-medium">{attendee.name}</p>
															<p className="text-xs text-muted-foreground">
																{attendee.registeredAt
																	? dayjs(attendee.registeredAt).format("MMM D, h:mm A")
																	: "Registration time unknown"}
															</p>
														</div>
													</div>
													<Badge
														variant="outline"
														className={
															attendee.status === "pending"
																? "border-amber-500/60 text-amber-700"
																: attendee.status === "rejected"
																	? "border-red-500/60 text-red-700"
																	: "border-green-500/60 text-green-700"
														}
													>
														{attendee.status}
													</Badge>
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{activeTab === "analytics" && (
					<div className="pt-2">
						{loading ? (
							<div className="space-y-3">
								<Skeleton className="h-28 w-full" />
								<Skeleton className="h-56 w-full" />
							</div>
						) : (
							<EventAdminStatisticsPanel
								range={range}
								onRangeChange={setRange}
								attendeesCount={goingAttendees.length}
								pendingCount={pendingAttendees.length}
								totalViews={filteredVisits.length}
								chartData={chartData}
								sourceBreakdown={sourceBreakdown}
								countryBreakdown={countryBreakdown}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}