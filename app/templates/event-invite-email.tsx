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

interface EventInviteEmailProps {
	eventTitle: string;
	communityName: string;
	recipientName: string;
	recipientEmail: string;
	inviteLink: string;
	eventLink: string;
	invitedByName: string;
	eventDate: string;
	eventTime: string;
}

export const EventInviteEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	recipientName = "Guest",
	recipientEmail = "guest@example.com",
	inviteLink = "https://luhive.com/c/community/event/invite/accept?token=123",
	eventLink = "https://luhive.com/c/community/event",
	invitedByName = "Community Member",
	eventDate = "Friday, January 1, 2026",
	eventTime = "6:00 PM UTC",
}: EventInviteEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Date", value: eventDate },
		{ label: "Time", value: eventTime },
		{ label: "Host", value: communityName },
		{ label: "Invited by", value: invitedByName },
	];

	return (
		<EmailLayout preview={`${invitedByName} invited you to ${eventTitle}`}>
			<Eyebrow>You're invited</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName}, {invitedByName} invited you to{" "}
				<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>,
				hosted by {communityName}.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={inviteLink}>Accept invitation →</CtaButton>
			<FinePrint>
				You can also{" "}
				<Link
					href={eventLink}
					style={{ color: emailColors.accent, textDecoration: "underline" }}
				>
					view the event page
				</Link>{" "}
				first.
			</FinePrint>
			<FinePrint>This invitation was sent to {recipientEmail}.</FinePrint>
		</EmailLayout>
	);
};

export default EventInviteEmail;
