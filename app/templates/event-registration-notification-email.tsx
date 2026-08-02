import * as React from "react";
import {
	CtaButton,
	DetailsCard,
	Divider,
	EmailLayout,
	EmailTitle,
	Eyebrow,
	Paragraph,
	SectionLabel,
	emailColors,
	type DetailRowData,
} from "./components/email-layout";

interface EventRegistrationNotificationEmailProps {
	eventTitle: string;
	registrantName: string;
	registrantEmail: string;
	hostCommunityName: string;
	coHostCommunityNames: string[];
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
}

export const EventRegistrationNotificationEmail = ({
	eventTitle = "Tech Meetup 2024",
	registrantName = "John Doe",
	registrantEmail = "user@example.com",
	hostCommunityName = "Tech Community",
	coHostCommunityNames = [],
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
}: EventRegistrationNotificationEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Name", value: registrantName },
		{ label: "Email", value: registrantEmail },
		{ label: "Date", value: eventDate },
		{ label: "Time", value: eventTime },
		{ label: "Host", value: hostCommunityName },
	];
	if (coHostCommunityNames.length > 0)
		rows.push({ label: "Co-hosts", value: coHostCommunityNames.join(", ") });

	return (
		<EmailLayout preview={`${registrantName} registered for ${eventTitle}`}>
			<Eyebrow>New registration</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName},{" "}
				<strong style={{ color: emailColors.heading }}>
					{registrantName}
				</strong>{" "}
				registered for {eventTitle}.
			</Paragraph>
			<SectionLabel>Registration details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View registrants →</CtaButton>
		</EmailLayout>
	);
};

export default EventRegistrationNotificationEmail;
