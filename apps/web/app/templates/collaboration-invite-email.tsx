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

interface CollaborationInviteEmailProps {
	eventTitle: string;
	hostCommunityName: string;
	coHostCommunityName: string;
	recipientEmail: string;
	inviteLink: string;
	eventLink: string;
	invitedByName: string;
}

export const CollaborationInviteEmail = ({
	eventTitle = "Tech Meetup 2024",
	hostCommunityName = "Tech Community",
	coHostCommunityName = "Your Community",
	recipientEmail = "recipient@example.com",
	inviteLink = "https://luhive.com/c/community/collaboration-invite/123",
	eventLink = "https://luhive.com/c/community/events/123",
	invitedByName = "Community Owner",
}: CollaborationInviteEmailProps) => {
	const rows: DetailRowData[] = [
		{ label: "Event", value: eventTitle },
		{ label: "Host", value: hostCommunityName },
		{ label: "Invited by", value: invitedByName },
	];

	return (
		<EmailLayout
			preview={`${hostCommunityName} invited ${coHostCommunityName} to co-host ${eventTitle}`}
		>
			<Eyebrow>Collaboration invite</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				<strong style={{ color: emailColors.heading }}>
					{hostCommunityName}
				</strong>{" "}
				invited{" "}
				<strong style={{ color: emailColors.heading }}>
					{coHostCommunityName}
				</strong>{" "}
				to co-host this event. As a co-host, the event appears on your
				community page and its stats show up on your dashboard.
			</Paragraph>
			<SectionLabel>Details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={inviteLink}>Accept collaboration →</CtaButton>
			<FinePrint>
				You can{" "}
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

export default CollaborationInviteEmail;
