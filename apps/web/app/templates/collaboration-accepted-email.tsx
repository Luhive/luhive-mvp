import * as React from "react";
import {
	CtaButton,
	Divider,
	EmailLayout,
	EmailTitle,
	Eyebrow,
	FinePrint,
	Paragraph,
	emailColors,
} from "./components/email-layout";

interface CollaborationAcceptedEmailProps {
	eventTitle: string;
	hostCommunityName: string;
	coHostCommunityName: string;
	recipientEmail: string;
	eventLink: string;
}

export const CollaborationAcceptedEmail = ({
	eventTitle = "Tech Meetup 2024",
	hostCommunityName = "Tech Community",
	coHostCommunityName = "Partner Community",
	eventLink = "https://luhive.com/c/community/events/123",
}: CollaborationAcceptedEmailProps) => (
	<EmailLayout
		preview={`${coHostCommunityName} is now co-hosting ${eventTitle}`}
	>
		<Eyebrow>Collaboration accepted</Eyebrow>
		<EmailTitle>{eventTitle}</EmailTitle>
		<Divider />
		<Paragraph>
			<strong style={{ color: emailColors.heading }}>
				{coHostCommunityName}
			</strong>{" "}
			accepted your invitation to co-host{" "}
			<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>. The
			event is now visible on both community pages, and both dashboards show
			its stats.
		</Paragraph>
		<CtaButton href={eventLink}>View event →</CtaButton>
		<FinePrint>Hosted together with {hostCommunityName}.</FinePrint>
	</EmailLayout>
);

export default CollaborationAcceptedEmail;
