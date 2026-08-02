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

interface NewCollaborationEventEmailProps {
	eventTitle: string;
	hostCommunityName: string;
	coHostCommunityName: string;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
	isNewEvent: boolean;
	locationAddress?: string;
	onlineMeetingLink?: string;
	unsubscribeUrl?: string;
}

export const NewCollaborationEventEmail = ({
	eventTitle = "Tech Meetup 2024",
	hostCommunityName = "Tech Community",
	coHostCommunityName = "Partner Community",
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	isNewEvent = true,
	locationAddress,
	onlineMeetingLink,
	unsubscribeUrl,
}: NewCollaborationEventEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Date", value: eventDate },
		{ label: "Time", value: eventTime },
		{ label: "Host", value: hostCommunityName },
		{ label: "Co-host", value: coHostCommunityName },
	];
	if (locationAddress) rows.push({ label: "Location", value: locationAddress });
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

	return (
		<EmailLayout
			preview={`${hostCommunityName} and ${coHostCommunityName} are co-hosting ${eventTitle}`}
			unsubscribeUrl={unsubscribeUrl}
		>
			<Eyebrow>{isNewEvent ? "New event" : "Event update"}</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName},{" "}
				<strong style={{ color: emailColors.heading }}>
					{hostCommunityName}
				</strong>{" "}
				and{" "}
				<strong style={{ color: emailColors.heading }}>
					{coHostCommunityName}
				</strong>{" "}
				are co-hosting this event.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View event →</CtaButton>
			<FinePrint>
				You're receiving this because you're a member of one of these
				communities.
			</FinePrint>
		</EmailLayout>
	);
};

export default NewCollaborationEventEmail;
