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

interface CommunityJoinNotificationProps {
	communityName: string;
	communitySlug: string;
	memberName: string;
	memberEmail: string;
	joinedAt: string;
	dashboardLink: string;
}

export const CommunityJoinNotification = ({
	communityName = "Tech Community",
	memberName = "John Doe",
	memberEmail = "user@example.com",
	joinedAt = new Date().toLocaleString(),
	dashboardLink = "https://luhive.com/dashboard",
}: CommunityJoinNotificationProps) => {
	const rows: DetailRowData[] = [
		{ label: "Name", value: memberName },
		{ label: "Email", value: memberEmail },
		{ label: "Joined", value: joinedAt },
	];

	return (
		<EmailLayout preview={`${memberName} joined ${communityName}`}>
			<Eyebrow>New member</Eyebrow>
			<EmailTitle>{communityName}</EmailTitle>
			<Divider />
			<Paragraph>
				<strong style={{ color: emailColors.heading }}>{memberName}</strong>{" "}
				just joined {communityName}.
			</Paragraph>
			<SectionLabel>Member details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={dashboardLink}>View members →</CtaButton>
		</EmailLayout>
	);
};

export default CommunityJoinNotification;
