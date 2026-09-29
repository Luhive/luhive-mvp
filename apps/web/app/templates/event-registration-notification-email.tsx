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
	ticketPrice?: string;
	registrationCount?: number;
	totalGain?: string;
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
	ticketPrice,
	registrationCount,
	totalGain,
}: EventRegistrationNotificationEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Name", value: registrantName },
		{ label: "Email", value: registrantEmail },
	];
	if (ticketPrice) {
		rows.push({ label: "Ticket", value: ticketPrice });
	}
	if (registrationCount !== undefined) {
		rows.push({ label: "Registrations", value: String(registrationCount) });
	}
	if (totalGain) {
		rows.push({ label: "Total gain", value: totalGain });
	}
	rows.push({ label: "Date", value: eventDate });
	rows.push({ label: "Time", value: eventTime });
	rows.push({ label: "Host", value: hostCommunityName });
	if (coHostCommunityNames.length > 0) {
		rows.push({ label: "Co-hosts", value: coHostCommunityNames.join(", ") });
	}

	const registrationLabel =
		registrationCount === undefined
			? undefined
			: registrationCount === 1
				? "1 registration"
				: `${registrationCount} registrations`;
	const preview =
		registrationLabel && totalGain
			? `${registrationLabel} · ${totalGain} total — ${registrantName} bought a ticket for ${eventTitle}`
			: ticketPrice
				? `${registrantName} bought a ticket for ${eventTitle}`
				: `${registrantName} registered for ${eventTitle}`;
	const action = ticketPrice ? "bought a ticket for" : "registered for";

	return (
		<EmailLayout preview={preview}>
			<Eyebrow>New registration</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName},{" "}
				<strong style={{ color: emailColors.heading }}>
					{registrantName}
				</strong>{" "}
				{action} {eventTitle}.
				{registrationLabel && totalGain
					? ` This event now has ${registrationLabel} and ${totalGain} in total.`
					: ""}
			</Paragraph>
			<SectionLabel>Registration details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View registrants →</CtaButton>
		</EmailLayout>
	);
};

export default EventRegistrationNotificationEmail;
