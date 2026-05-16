import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { BarChart3, Eye, QrCode, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "~/shared/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "~/shared/components/ui/toggle-group";

export type EventAdminTimeRange = "1d" | "3d" | "7d" | "30d" | "90d";

export type EventAdminChartPoint = {
	key: string;
	label: string;
	views: number;
	attendees: number;
};

export type EventAdminBreakdownRow = {
	label: string;
	count: number;
};

interface EventAdminStatisticsPanelProps {
	range: EventAdminTimeRange;
	onRangeChange: (range: EventAdminTimeRange) => void;
	attendeesCount: number;
	pendingCount?: number;
	totalViews: number;
	chartData: EventAdminChartPoint[];
	sourceBreakdown: EventAdminBreakdownRow[];
	countryBreakdown: EventAdminBreakdownRow[];
	compact?: boolean;
	layout?: "overview" | "analytics";
}

const chartConfig = {
	views: {
		label: "Views",
		color: "hsl(var(--chart-1))",
	},
	attendees: {
		label: "Attendees",
		color: "#fb923c",
	},
} satisfies ChartConfig;

export function EventAdminStatisticsPanel({
	range,
	onRangeChange,
	attendeesCount,
	pendingCount = 0,
	totalViews,
	chartData,
	sourceBreakdown,
	countryBreakdown,
	compact = false,
	layout = "analytics",
}: EventAdminStatisticsPanelProps) {
	const chartId = useId().replace(/:/g, "");

	if (layout === "overview") {
		const totalSourceCount = sourceBreakdown.reduce((sum, row) => sum + row.count, 0);
		const topSourceRows = sourceBreakdown.slice(0, 3).map((row) => ({
			...row,
			percent: totalSourceCount ? Math.round((row.count / totalSourceCount) * 100) : 0,
		}));

		return (
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					<Card className="h-[176px] border-border/60 rounded-xl">
						<CardHeader className="pb-0">
							<div className="flex items-center justify-between">
								<CardTitle className="text-[20px] leading-none font-bold tracking-[-0.02em]">Attendees</CardTitle>
								<p className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2 text-[12px] leading-none text-foreground">
									<QrCode className="h-4 w-4" />
									QR Scan
								</p>
							</div>
						</CardHeader>
						<CardContent className="flex h-full items-end justify-between pt-0 pb-4">
							<div className="flex items-end justify-between gap-3">
								<p className="text-[48px] font-semibold tabular-nums leading-none">{attendeesCount}</p>
								{pendingCount > 0 ? (
									<p className="text-[16px] font-normal leading-none text-orange-500 underline underline-offset-2">+{pendingCount} new</p>
								) : (
									<p className="text-xs text-muted-foreground">&nbsp;</p>
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="h-[176px] border-border/60 rounded-xl">
						<CardHeader className="pb-0">
							<div className="flex items-center justify-between">
								<CardTitle className="text-[20px] leading-none font-medium tracking-[-0.02em]">Event Views</CardTitle>
								<p className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2 text-[12px] leading-none text-foreground">
									<BarChart3 className="h-3.5 w-3.5" />
									Full Stats
								</p>
							</div>
						</CardHeader>
						<CardContent className="flex h-full items-end pb-4 pt-0">
							<div className="grid w-full grid-cols-[1fr_255px] items-end gap-4">
								<p className="text-[48px] font-semibold tabular-nums leading-none self-end">{totalViews}</p>
								<div className="rounded-xl bg-muted/45 px-4 py-3 space-y-1">
									{topSourceRows.length === 0 ? (
										<p className="text-sm text-muted-foreground">No sources</p>
									) : (
										topSourceRows.map((row) => (
                                            // font weight 600
											<div key={row.label} className="flex items-center  justify-between font-manrope font-semibold text-[12px] leading-[150%] tracking-normal">
												<p className="text-muted-foreground capitalize ">{row.label}</p>
												<p className="tabular-nums font-medium text-foreground">{row.percent}%</p>
											</div>
										))
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="border-none shadow-none">
					<CardHeader className="pb-1">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-2xl font-semibold tabular-nums leading-none">{totalViews}</p>
								<p className="mt-1 text-[11px] text-muted-foreground">Total for selected range</p>
							</div>
							<div className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background p-1">
								{([
									{ key: "7d", label: "Last 7 Days" },
									{ key: "30d", label: "Last 30 Days" },
									{ key: "90d", label: "Last 3 Months" },
								] as const).map((item) => (
									<button
										key={item.key}
										type="button"
										onClick={() => onRangeChange(item.key)}
										className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
											range === item.key
												? "bg-orange-500 text-white"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{item.label}
									</button>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-1">
						<ChartContainer config={chartConfig} className="h-[180px] w-full" id={`event-admin-line-${chartId}`}>
							<AreaChart data={chartData} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
								<defs>
									<linearGradient id={`fillViewsOverview-${chartId}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
										<stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
									</linearGradient>
									<linearGradient id={`fillAttendeesOverview-${chartId}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} />
								<XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="views"
									stroke="#f97316"
									strokeWidth={2}
									fill={`url(#fillViewsOverview-${chartId})`}
									dot={false}
								/>
								<Area
									type="monotone"
									dataKey="attendees"
									stroke="#fb923c"
									strokeWidth={1.5}
									fill={`url(#fillAttendeesOverview-${chartId})`}
									dot={false}
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Attendees
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-between pt-0">
						<p className="text-4xl font-semibold tabular-nums">{attendeesCount}</p>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Event Views
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-between pt-0">
						<p className="text-4xl font-semibold tabular-nums">{totalViews}</p>
						<Eye className="h-4 w-4 text-muted-foreground" />
					</CardContent>
				</Card>
			</div>

			<Card className="">
				<CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
					<CardTitle className="text-sm font-medium">Views Trend</CardTitle>
					<ToggleGroup
						type="single"
						value={range}
						onValueChange={(value) => value && onRangeChange(value as EventAdminTimeRange)}
						variant="outline"
						size="sm"
						className="rounded-md border border-border/70 bg-muted/20 p-1"
					>
						<ToggleGroupItem value="7d" className="text-xs">Last 7 days</ToggleGroupItem>
						<ToggleGroupItem value="30d" className="text-xs">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="90d" className="text-xs">Last 3 months</ToggleGroupItem>
					</ToggleGroup>
				</CardHeader>
				<CardContent className="pt-0">
					<ChartContainer config={chartConfig} className="h-[180px] w-full" id={`event-admin-${chartId}`}>
						<AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
							<defs>
								<linearGradient id={`fillViews-${chartId}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
								</linearGradient>
								<linearGradient id={`fillAttendees-${chartId}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
									<stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Area
								type="monotone"
								dataKey="views"
								stroke="#f97316"
								fill={`url(#fillViews-${chartId})`}
								strokeWidth={2}
							/>
							<Area
								type="monotone"
								dataKey="attendees"
								stroke="#fb923c"
								fill={`url(#fillAttendees-${chartId})`}
								strokeWidth={1.5}
							/>
						</AreaChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<div className={`grid grid-cols-1 gap-3 ${compact ? "" : "lg:grid-cols-2"}`}>
				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">View Sources</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 pt-0">
						{sourceBreakdown.length === 0 ? (
							<p className="text-sm text-muted-foreground">No source data yet.</p>
						) : (
							sourceBreakdown.slice(0, compact ? 4 : 8).map((row) => (
								<div key={row.label} className="flex items-center justify-between text-sm">
									<p className="font-medium capitalize">{row.label}</p>
									<p className="tabular-nums text-muted-foreground">{row.count}</p>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Top Countries</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 pt-0">
						{countryBreakdown.length === 0 ? (
							<p className="text-sm text-muted-foreground">No country data yet.</p>
						) : (
							countryBreakdown.slice(0, compact ? 4 : 8).map((row) => (
								<div key={row.label} className="flex items-center justify-between text-sm">
									<p className="font-medium capitalize">{row.label}</p>
									<p className="tabular-nums text-muted-foreground">{row.count}</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}