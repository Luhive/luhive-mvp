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

interface EventRegistrationRequestEmailProps {
	eventTitle: string;
	communityName: string;
	eventLink: string;
	recipientName: string;
	eventDate?: string;
	eventTime?: string;
}

export const EventRegistrationRequestEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	eventDate,
	eventTime,
}: EventRegistrationRequestEmailProps) => {
	const rows: DetailRowData[] = [];
	if (eventDate) rows.push({ label: "Date", value: eventDate });
	if (eventTime) rows.push({ label: "Time", value: eventTime });
	rows.push({ label: "Host", value: communityName });

	return (
		<EmailLayout preview={`Your request to join ${eventTitle} is pending`}>
			<Eyebrow>Registration pending</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName}, your request to join{" "}
				<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>{" "}
				has been sent to {communityName}. We'll email you as soon as the
				organizer reviews it.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View event →</CtaButton>
			<FinePrint>No action is needed from you right now.</FinePrint>
		</EmailLayout>
	);
};

export default EventRegistrationRequestEmail;
