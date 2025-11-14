import { createEvent, EventAttributes, DateArray } from "ics";

interface ICSEventData {
	title: string;
	description?: string;
	location?: string;
	startTime: string; // ISO format
	endTime: string; // ISO format
	url?: string;
	organizerName: string;
	organizerEmail?: string;
}

export function generateICS(data: ICSEventData): string {
	const {
		title,
		description,
		location,
		startTime,
		endTime,
		url,
		organizerName,
		organizerEmail,
	} = data;

	// Convert ISO date to DateArray format [year, month, day, hour, minute]
	const toDateArray = (isoString: string): DateArray => {
		const date = new Date(isoString);
		return [
			date.getUTCFullYear(),
			date.getUTCMonth() + 1, // Month is 0-indexed, ics needs 1-indexed
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
		];
	};

	const event: EventAttributes = {
		start: toDateArray(startTime),
		end: toDateArray(endTime),
		title,
		description: description || `Event: ${title}`,
		location: location || undefined,
		url: url || undefined,
		status: "CONFIRMED",
		busyStatus: "BUSY",
		organizer: {
			name: organizerName,
			email: organizerEmail || "events@luhive.com",
		},
		alarms: [
			{
				action: "display",
				description: "Event reminder",
				trigger: { hours: 1, before: true }, // 1 hour before
			},
		],
	};

	const { error, value } = createEvent(event);

	if (error) {
		console.error("Error creating ICS file:", error);
		throw new Error(`Failed to create calendar event: ${error.message}`);
	}

	return value || "";
}

