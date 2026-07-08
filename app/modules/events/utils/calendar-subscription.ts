import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface CalendarSubscriptionInput {
	title: string;
	description?: string | null;
	startTime: string;
	endTime?: string | null;
	timezone?: string;
	location?: string | null;
	url?: string;
	organizerName?: string;
	organizerEmail?: string;
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000;
const ORGANIZER_EMAIL = "events@luhive.com";

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

function toUtcStamp(iso: string): string {
	const date = new Date(iso);
	return [
		date.getUTCFullYear(),
		pad(date.getUTCMonth() + 1),
		pad(date.getUTCDate()),
		"T",
		pad(date.getUTCHours()),
		pad(date.getUTCMinutes()),
		pad(date.getUTCSeconds()),
		"Z",
	].join("");
}

function toOutlookDateTime(iso: string, timezoneName: string): string {
	// Outlook ignores offsets and mishandles UTC "Z". Omit timezone suffix so
	// Outlook treats the event wall-clock time as the user's local timezone.
	return dayjs(iso).tz(timezoneName).format("YYYY-MM-DDTHH:mm:ss");
}

function escapeIcsText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line: string): string {
	const maxLength = 75;
	if (line.length <= maxLength) {
		return line;
	}

	const chunks: string[] = [line.slice(0, maxLength)];
	let index = maxLength;

	while (index < line.length) {
		chunks.push(` ${line.slice(index, index + maxLength - 1)}`);
		index += maxLength - 1;
	}

	return chunks.join("\r\n");
}

function sanitizeFilename(title: string): string {
	const sanitized = title.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
	return sanitized || "event";
}

export class CalendarSubscription {
	private readonly title: string;
	private readonly description: string;
	private readonly startTime: string;
	private readonly endTime: string;
	private readonly timezone: string;
	private readonly location: string;
	private readonly url: string;
	private readonly organizerName: string;
	private readonly organizerEmail: string;

	constructor(input: CalendarSubscriptionInput) {
		this.title = input.title;
		this.description = input.description?.trim() || `Event: ${input.title}`;
		this.startTime = input.startTime;
		this.endTime =
			input.endTime ??
			new Date(new Date(input.startTime).getTime() + DEFAULT_DURATION_MS).toISOString();
		this.timezone = input.timezone ?? "UTC";
		this.location = input.location?.trim() || "Online Event";
		this.url = input.url ?? "";
		this.organizerName = input.organizerName ?? "Luhive";
		this.organizerEmail = input.organizerEmail ?? ORGANIZER_EMAIL;
	}

	getGoogleCalendarUrl(): string {
		const params = new URLSearchParams({
			action: "TEMPLATE",
			text: this.title,
			dates: `${toUtcStamp(this.startTime)}/${toUtcStamp(this.endTime)}`,
			details: this.url ? `${this.description}\n\n${this.url}` : this.description,
			location: this.location,
			ctz: this.timezone,
		});

		return `https://calendar.google.com/calendar/render?${params.toString()}`;
	}

	getOutlookUrl(): string {
		const params = new URLSearchParams({
			path: "/calendar/action/compose",
			rru: "addevent",
			subject: this.title,
			body: this.url ? `${this.description}\n\n${this.url}` : this.description,
			startdt: toOutlookDateTime(this.startTime, this.timezone),
			enddt: toOutlookDateTime(this.endTime, this.timezone),
			location: this.location,
		});

		return `https://outlook.live.com/calendar/deeplink/compose?${params.toString()}`;
	}

	generateIcsContent(): string {
		const uid =
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: `${Date.now()}@luhive.com`;

		const lines = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Luhive//Event Calendar//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
			`DTSTART:${toUtcStamp(this.startTime)}`,
			`DTEND:${toUtcStamp(this.endTime)}`,
			foldIcsLine(`SUMMARY:${escapeIcsText(this.title)}`),
			foldIcsLine(`DESCRIPTION:${escapeIcsText(this.description)}`),
			foldIcsLine(`LOCATION:${escapeIcsText(this.location)}`),
			this.url ? foldIcsLine(`URL:${escapeIcsText(this.url)}`) : null,
			foldIcsLine(
				`ORGANIZER;CN=${escapeIcsText(this.organizerName)}:mailto:${this.organizerEmail}`,
			),
			"STATUS:CONFIRMED",
			"END:VEVENT",
			"END:VCALENDAR",
		].filter((line): line is string => Boolean(line));

		return `${lines.join("\r\n")}\r\n`;
	}

	downloadIcs(): void {
		const content = this.generateIcsContent();
		const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
		const objectUrl = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = objectUrl;
		anchor.download = `${sanitizeFilename(this.title)}.ics`;
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(objectUrl);
	}

	openGoogleCalendar(): void {
		window.open(this.getGoogleCalendarUrl(), "_blank", "noopener,noreferrer");
	}

	openOutlook(): void {
		window.open(this.getOutlookUrl(), "_blank", "noopener,noreferrer");
	}
}
