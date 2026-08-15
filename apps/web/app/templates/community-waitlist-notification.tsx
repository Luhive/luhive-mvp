import { Link } from "@react-email/components";
import * as React from "react";
import {
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

interface CommunityWaitlistNotificationProps {
	communityName: string;
	userName: string;
	userEmail: string;
	website?: string | null;
	description?: string | null;
	submittedAt: string;
}

export const CommunityWaitlistNotification = ({
	communityName = "Tech Community",
	userName = "John Doe",
	userEmail = "user@example.com",
	website = null,
	description = null,
	submittedAt = new Date().toLocaleString(),
}: CommunityWaitlistNotificationProps) => {
	const rows: DetailRowData[] = [
		{ label: "Community", value: communityName },
		{ label: "Submitted by", value: `${userName} (${userEmail})` },
	];
	if (website)
		rows.push({
			label: "Website",
			value: (
				<Link
					href={website}
					style={{ color: emailColors.accent, textDecoration: "underline" }}
				>
					{website}
				</Link>
			),
		});
	if (description) rows.push({ label: "Description", value: description });
	rows.push({ label: "Submitted", value: submittedAt });

	return (
		<EmailLayout preview={`New community request: ${communityName}`}>
			<Eyebrow>Community request</Eyebrow>
			<EmailTitle>{communityName}</EmailTitle>
			<Divider />
			<Paragraph>
				A new community was submitted to the waitlist by{" "}
				<strong style={{ color: emailColors.heading }}>{userName}</strong>.
			</Paragraph>
			<SectionLabel>Request details</SectionLabel>
			<DetailsCard rows={rows} />
			<FinePrint>
				Review the request and create the community manually if approved. The
				user has been notified that their request is pending review.
			</FinePrint>
		</EmailLayout>
	);
};

export default CommunityWaitlistNotification;
