import { Link } from "@react-email/components";
import * as React from "react";
import {
	CtaButton,
	DetailsCard,
	Divider,
	EmailLayout,
	EmailTitle,
	Eyebrow,
	FinePrint,
	Paragraph,
	SectionLabel,
	emailColors,
	type DetailRowData,
} from "./components/email-layout";

interface EventUpdateEmailProps {
	eventTitle: string;
	communityName: string;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
	locationAddress?: string;
	locationMapUrl?: string;
	onlineMeetingLink?: string;
}

export const EventUpdateEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	locationAddress,
	locationMapUrl,
	onlineMeetingLink,
}: EventUpdateEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Date", value: eventDate },
		{ label: "Time", value: eventTime },
	];
	if (locationAddress)
		rows.push({
			label: "Location",
			value: locationMapUrl ? (
				<>
					{locationAddress}{" "}
					<Link
						href={locationMapUrl}
						style={{ color: emailColors.accent, textDecoration: "underline" }}
					>
						Map
					</Link>
				</>
			) : (
				locationAddress
			),
		});
	if (onlineMeetingLink)
		rows.push({
			label: "Online",
			value: (
				<Link
					href={onlineMeetingLink}
					style={{ color: emailColors.accent, textDecoration: "underline" }}
				>
					Join meeting
				</Link>
			),
		});
	rows.push({ label: "Host", value: communityName });

	return (
		<EmailLayout preview={`${eventTitle} — time or location changed`}>
			<Eyebrow>Event updated</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName}, the time or location of{" "}
				<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>{" "}
				has changed. Here are the current details.
			</Paragraph>
			<SectionLabel>Updated details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View event →</CtaButton>
			<FinePrint>
				If you can no longer attend, you can update your RSVP on the event
				page.
			</FinePrint>
		</EmailLayout>
	);
};

export default EventUpdateEmail;
