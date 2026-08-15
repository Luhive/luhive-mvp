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

interface NewEventNotificationEmailProps {
	eventTitle: string;
	communityName: string;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
	locationAddress?: string;
	locationMapUrl?: string;
	onlineMeetingLink?: string;
	unsubscribeUrl?: string;
}

export const NewEventNotificationEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	locationAddress,
	locationMapUrl,
	onlineMeetingLink,
	unsubscribeUrl,
}: NewEventNotificationEmailProps) => {
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
		<EmailLayout
			preview={`${communityName} announced ${eventTitle}`}
			unsubscribeUrl={unsubscribeUrl}
		>
			<Eyebrow>New event</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName},{" "}
				<strong style={{ color: emailColors.heading }}>{communityName}</strong>{" "}
				just announced a new event.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View event →</CtaButton>
			<FinePrint>
				You're receiving this because you're a member of {communityName}.
			</FinePrint>
		</EmailLayout>
	);
};

export default NewEventNotificationEmail;
